import {
  AfterViewInit,
  Directive,
  ElementRef,
  NgZone,
  OnDestroy,
} from '@angular/core';

/**
 * SidebarNavGroupManagerDirective
 *
 * Manages which top-level sidebar nav-group appears "active" using a custom
 * `nav-group-active` CSS class. This class is styled to match the visual
 * appearance of CoreUI's `.show` class (background, toggle color, arrow rotation).
 *
 * Why a custom class instead of manipulating `show`:
 * CoreUI's `SidebarNavGroupComponent` drives the `show` class via Angular's
 * `@HostBinding('class')` getter `{ show: this.open }`. Angular's change
 * detection will always override any manual class manipulation on that binding.
 * The custom `nav-group-active` class lives outside Angular's binding system
 * and is therefore persistent.
 *
 * Behavior:
 * - A top-level group becomes active only when one of its child nav items has
 *   the active/selected state (`.active`, `.router-link-active`, etc.).
 * - Clicking the group toggle to expand/collapse the menu no longer forces
 *   `nav-group-active`; it only remains while a child submenu item is active.
 * - When a different child route becomes active → `nav-group-active` shifts to that
 *   group. The previously active group's class is removed.
 * - Sidebar collapse/expand: `nav-group-active` is never touched — state persists.
 * - Nested sub-groups are ignored (only top-level groups are managed).
 */
@Directive({
  selector: 'c-sidebar-nav[sidebarNavGroupManager]',
})
export class SidebarNavGroupManagerDirective implements AfterViewInit, OnDestroy {

  private mutationObserver: MutationObserver | null = null;
  /** Cleanup fn returned by the outside-zone click listener. */
  private removeClickListener: (() => void) | null = null;
  /** The currently active top-level nav group element. */
  private activeGroup: HTMLElement | null = null;

  constructor(
    private el: ElementRef<HTMLElement>,
    private ngZone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    // Run outside Angular's zone so that:
    // 1. MutationObserver callbacks don't trigger unnecessary change detection.
    // 2. Direct classList manipulation doesn't trigger change detection.
    // 3. Click listener doesn't trigger change detection.
    this.ngZone.runOutsideAngular(() => {
      // --- MutationObserver: track which top-level group has an active child link ---
      this.mutationObserver = new MutationObserver((mutations) =>
        this.handleMutations(mutations)
      );

      this.mutationObserver.observe(this.el.nativeElement, {
        subtree: true,
        attributeFilter: ['class'],
        attributeOldValue: true,
      });

      // Initialize active group from current DOM state.
      this.syncActiveGroupFromActiveChild();

      // --- Click listener: clear active group on standalone top-level link click ---
      const host = this.el.nativeElement;
      const onClick = (event: Event) => this.onNavClick(event as MouseEvent);
      host.addEventListener('click', onClick);
      this.removeClickListener = () => host.removeEventListener('click', onClick);
    });
  }

  ngOnDestroy(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = null;
    this.removeClickListener?.();
    this.removeClickListener = null;
  }

  // ---------------------------------------------------------------------------
  // Core logic
  // ---------------------------------------------------------------------------

  /**
   * Processes DOM class mutations and updates which top-level nav group is
   * visually active based on whether one of its child links is currently active.
   */
  private handleMutations(mutations: MutationRecord[]): void {
    const topLevelGroups = this.getTopLevelNavGroups();
    const activeGroup = topLevelGroups.find(group => this.groupHasActiveChild(group));

    if (activeGroup) {
      this.setActiveGroup(activeGroup);
      return;
    }

    // No active child anywhere in the top-level groups -> clear the previously
    // tracked active group, if any.
    if (this.activeGroup) {
      this.clearActiveGroup();
    }
  }

  /**
   * Fires on every click inside the sidebar nav (event delegation).
   *
   * Detects clicks on standalone top-level nav links — i.e., a `.nav-link`
   * that is NOT a `.nav-group-toggle` AND is NOT nested inside any
   * `c-sidebar-nav-group`. Example: the "Dashboard" item.
   *
   * When such a link is clicked, the active group (if any) should lose its
   * `nav-group-active` class because the user has explicitly left the group
   * context by navigating to an ungrouped page.
   */
  private onNavClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    // Find the closest nav-link that was clicked
    const link = target.closest('.nav-link') as HTMLElement | null;
    if (!link) return;

    // Ignore clicks on group toggles — those open/close groups
    if (link.classList.contains('nav-group-toggle')) return;

    // Check whether this link lives inside a nav-group.
    // If closest('c-sidebar-nav-group') returns null, it's a top-level standalone link.
    const parentGroup = link.closest('c-sidebar-nav-group') as HTMLElement | null;
    if (parentGroup !== null) return; // child item inside a group — do nothing

    // It's a top-level standalone link → clear the active group
    this.clearActiveGroup();
  }

  /**
   * Removes `nav-group-active` from the currently tracked active group
   * and resets the internal reference. Safe to call when no group is active.
   */
  private clearActiveGroup(): void {
    if (!this.activeGroup) return;

    this.mutationObserver?.disconnect();
    this.activeGroup.classList.remove('nav-group-active');
    this.activeGroup = null;
    this.mutationObserver?.observe(this.el.nativeElement, {
      subtree: true,
      attributeFilter: ['class'],
      attributeOldValue: true,
    });
  }

  /**
   * Finds which top-level group contains an active child link and sets it as the
   * active visual group. If no child link is active, clears the previous state.
   */
  private syncActiveGroupFromActiveChild(): void {
    const activeGroup = this.getTopLevelNavGroups().find(group => this.groupHasActiveChild(group));

    if (activeGroup) {
      this.setActiveGroup(activeGroup);
    } else {
      this.clearActiveGroup();
    }
  }

  /**
   * Returns true when a top-level group contains a child item that is active.
   * Supports both Angular router active classes and the standard `.active` class.
   */
  private groupHasActiveChild(group: HTMLElement): boolean {
    return Array.from(group.querySelectorAll<HTMLElement>('.nav-link')).some(link => {
      const isActive =
        link.classList.contains('active') ||
        link.classList.contains('router-link-active') ||
        link.classList.contains('router-link-exact-active') ||
        link.getAttribute('aria-current') === 'page';

      return isActive;
    });
  }

  /**
   * Transfers the `nav-group-active` class to `newActive`,
   * removing it from any previously active group.
   * All manipulation is done via direct classList (outside Angular zone)
   * so Angular's HostBinding does not interfere.
   */
  private setActiveGroup(newActive: HTMLElement): void {
    // Pause observer to avoid re-entrant callbacks from our own changes
    this.mutationObserver?.disconnect();

    // Remove from previous active group if it's different
    if (this.activeGroup && this.activeGroup !== newActive) {
      this.activeGroup.classList.remove('nav-group-active');
    }

    // Set new active group
    this.activeGroup = newActive;
    newActive.classList.add('nav-group-active');

    // Reconnect observer
    this.mutationObserver?.observe(this.el.nativeElement, {
      subtree: true,
      attributeFilter: ['class'],
      attributeOldValue: true,
    });
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  /** Returns top-level `c-sidebar-nav-group` elements only (not nested ones). */
  private getTopLevelNavGroups(): HTMLElement[] {
    return Array.from(
      this.el.nativeElement.querySelectorAll<HTMLElement>(
        ':scope > c-sidebar-nav-group'
      )
    );
  }
}
