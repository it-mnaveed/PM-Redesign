import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';

@Component({
  selector: 'app-assign-permissions',
  templateUrl: './assign-permissions.component.html',
  styleUrls: ['./assign-permissions.component.css']
})
export class AssignPermissionsComponent implements OnInit {
  submitted: boolean;
  loading: boolean;
  isUpdate: boolean;
  ParentPermissionsList: any;
  searchData = "";
  RecordCount: any;
  modelParrent: any;
  p: any;
  baseUrl: any = '/Permissions/';
  PermissionsList: any = [];
  RolesList: any;
  modelRoleId: any;
  groupedNotAssignedPermissions: any[] = [];
  groupedAssignedPermissions: any[] = [];
  constructor(
    private toastr: ToastrService,
    private _service: SharedService,
  ) { }
  expandedAssignedParent: number | null = null;
  expandedNotAssignedParent: number | null = null;

  toggleAssignedParent(index: number): void {
    this.expandedAssignedParent = this.expandedAssignedParent === index ? null : index;
  }

  toggleNotAssignedParent(index: number): void {
    this.expandedNotAssignedParent = this.expandedNotAssignedParent === index ? null : index;
  }
  ngOnInit(): void {
    this.GetRolesList();
  }

  onSubmit() {

    let url = this.baseUrl + 'PostAssignPermissions';
    this._service.Post(this.PermissionsList, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetAssignPermissionsList(this.modelRoleId);
        } else {
          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => {

      },
    });
  }
  GetRolesList() {

    let url = '/RoleManagement/GetRoles?Status=Active';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.RolesList = result.data;
        }
      },
      error: (err: any) => { },
    });
  }
  GetAssignPermissionsList(event: any) {
    debugger
    let url = this.baseUrl + 'GetAssignedPermissions?RoleId=' + event;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          
          this.PermissionsList = result.data;
          this.groupedAssignedPermissions = this.groupPermissionsByParent(this.PermissionsList.assignPermissions);
          this.groupedNotAssignedPermissions = this.groupPermissionsByParent(this.PermissionsList.notassignPermissions);
        }
      },
      error: (err: any) => {

      },
    });
  }
  onSelectChange(data: any) {

    if (data.isAssign) {
      data.canCreate = true;
      data.canUpdate = true;
      data.canDelete = true;
      data.canView = true;

    } else {
      data.canCreate = false;
      data.canUpdate = false;
      data.canDelete = false;
      data.canView = false;
    }
  }
  groupPermissionsByParent(permissions: any[]): any[] {
    const grouped: any = {};

    permissions.forEach(p => {
      if (!grouped[p.parrent]) {
        grouped[p.parrent] = [];
      }
      grouped[p.parrent].push(p);
    });

    return Object.entries(grouped).map(([parrent, items]) => ({
      parrent,
      items
    }));
  }

}