import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';

import { ClassToggleService, HeaderComponent } from '@coreui/angular';
import { SharedHelper } from '../../../_Helper/SharedHelper';
import { ConfigService } from '../../../_services/LoadConfigFile';
import { TranslateService } from '@ngx-translate/core';
import { SharedService } from '../../../_services/shared.service';

@Component({
  selector: 'app-default-header',
  templateUrl: './default-header.component.html',
   styleUrls: ['./default-header.component.scss']
})

export class DefaultHeaderComponent extends HeaderComponent implements OnInit {


  @Input() sidebarId: string = "sidebar";



  public newMessages = new Array(4)
  public newTasks = new Array(5)
  public newNotifications = new Array(5)
  CUrrentDate: string = '';
  isPurpleTheme: boolean = true;
  showThemeToggle: boolean = false;
  currentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  UserFullName: any;
  UserType: any;
  UserImage: any;
  currentLang: any = 'en';
  PendingDocumentList: any;
  showNotifications = false;
  notificationItems = [
    {
      title: 'Pending approvals',
      message: 'There are documents waiting for your review.'
    },
    {
      title: 'Approval reminder',
      message: 'A few approvals need your attention today.'
    },
    {
      title: 'Document review',
      message: 'New items were submitted and require action.'
    }
  ];

  constructor(
    private classToggler: ClassToggleService,
    private route: Router,
    private _sharedHelper: SharedHelper,
    private configService: ConfigService,
    private translate: TranslateService,
    private renderer: Renderer2, private el: ElementRef,
    private _service: SharedService
  ) {
    super();
  }

  ngOnInit(): void {
    this.CUrrentDate = this.getFormattedDate();
    this.currentUserInfo = this._sharedHelper.getCurrentUserInfo();
    this.UserFullName = this.currentUserInfo.FullName;
    this.UserType = this.currentUserInfo.RoleName;
    if (this.currentUserInfo.UserImage) {
      this.UserImage = this.configService.config.baseUrl + this.currentUserInfo.UserImage;
    }
    this.switchLang('')
    this.GetPendingDocuments("");

    // Default to purple on app startup and keep compatibility with both spellings.
    const body = document.body;
    const classA = 'agreePilotPurpulr';
    const classB = 'agreePilotPurple';

    body.classList.remove(classA);
    body.classList.add(classB);
    this.isPurpleTheme = true;
  }

  toggleTheme() {
    const body = document.body;
    const classA = 'agreePilotPurpulr';
    const classB = 'agreePilotPurple';

    if (this.isPurpleTheme) {
      body.classList.remove(classA);
      body.classList.remove(classB);
      this.isPurpleTheme = false;
    } else {
      body.classList.add(classA);
      body.classList.add(classB);
      this.isPurpleTheme = true;
    }
  }
  getFormattedDate(): string {
    const today = new Date();

    const day = today.getDate();
    const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
    const month = today.toLocaleDateString('en-US', { month: 'long' });
    const year = today.getFullYear();

    const dayWithSuffix = day + this.getOrdinalSuffix(day);

    return `Today is ${weekday}, ${dayWithSuffix} ${month} ${year}.`;
  }
  getOrdinalSuffix(day: number): string {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  LogOut() {
    localStorage.removeItem('token');
    localStorage.removeItem('key');
    this.route.navigate(['/login']);
  }

  switchLang(lang: string) {
    this.translate.use(lang);

    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);

    // Wait a tick to ensure scrollbar wrapper exists in DOM
    setTimeout(() => {
      const scrollbars = document.querySelectorAll('.ng-scrollbar-wrapper');
      scrollbars.forEach(sb => {
        sb.setAttribute('dir', dir);
        sb.setAttribute('verticalhovered', dir === 'ltr' ? 'true' : 'false');
      });
    }, 50);
  }
  GetPendingDocuments(Id: any) {
    
    let UserId = parseInt(this.currentUserInfo.Id);
    let url = '/DocumentApproval/getPendingDocuments?userid=' + UserId;

    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.PendingDocumentList = result.data.length
        }
      },
      error: (err: any) => { },
    });
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }

  goToPendingDocuments(): void {
    this.closeNotifications();
    this.route.navigate(['/approvals/pending-documents']);
  }

  onDocumentClick(event: Event): void {
    if (this.showNotifications && !this.el.nativeElement.contains(event.target)) {
      this.closeNotifications();
    }
  }

  getUserInitials(fullName: string): string {
    if (!fullName) {
      return '';
    }

    const names = fullName.trim().split(/\s+/);

    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }

    return (
      names[0].charAt(0) +
      names[names.length - 1].charAt(0)
    ).toUpperCase();
  }
  getAvatarColor(name: string): string {
  const colors = [
    '#1A73E8',
    '#5B5FC7',
    '#0F766E',
    '#9333EA',
    '#EA580C',
    '#DC2626',
    '#0891B2'
  ];

  let hash = 0;

  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }

  return colors[hash % colors.length];
}
}
