import { AfterViewInit, Component, ElementRef, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { InputFieldValidator } from '../../_Helper/InputFieldValidator';
import { ConfigService } from '../../_services/LoadConfigFile';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css']
})
export class UsersComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  form: FormGroup;
  submitted: boolean;
  loading: boolean;
  isUpdate: boolean;
  RolesList: any;
  UsersList: any;
  searchData = "";
  modelLocation: any;
  baseUrl: any = "/UserManagement/"
  p: any;
  modelRoleId: any;
  FileURL: any;
  LocationsList: any;
  showPassword: boolean = false;
  showModal: boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _inputField: InputFieldValidator,
    private configService: ConfigService,
    private _sharedHelper: SharedHelper
  ) { }
  @ViewChild('fileInput') fileInput!: ElementRef;
  ngAfterViewInit(): void {
    this.dtTrigger.next(null); // no need to pass 0
  }

  ngOnDestroy(): void {
    // ✅ Prevent memory leaks
    this.dtTrigger.unsubscribe();
  }
  ngOnInit(): void {

    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10,
      processing: true,
      ordering: true,
      // scrollCollapse: true,
      // autoWidth:false,
      scrollX: true
    };

    this.form = this.formBuilder.group({
      Id: [0],
      FirstName: ['', Validators.required],
      LastName: [''],
      Email: ['', [Validators.required, Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$")]],
      // UserCode: ['', [Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(4), Validators.maxLength(5)]],
      Password: ['', Validators.required],
      HomeAddress: ['', Validators.required],
      OfficeAddress: [''],
      MobileNo: ['', [Validators.required, Validators.pattern("^[0-9]*$"), Validators.minLength(10), Validators.maxLength(13)]],
      TelNo: [''],
      Image: [''],
      RoleId: [0, Validators.required],
      CreatedBy: [''],
      CreatedDate: [null],
      UpdatedBy: [''],
      UpdatedDate: [null],
      IsActive: [false],

      LocationName: [''],
    });
    this.GetRolesList();
    this.GetUsersList();

  }
  get f() { return this.form.controls; }
  onSubmit() {
    
    this.submitted = true;
    if (this.form.invalid) {
      console.log("Error", this.form.value);
      return;
    }
    this.form.value.CreatedBy = '';
    this.form.value.UpdatedBy = '';
    if (this.form.value.Id == null) {
      this.form.value.Id = 0;
    }
    this.form.controls['Image'].setValue(this.FileURL);
    let url = this.baseUrl + 'CreateUser';
    // if(this.FileURL){
    //   this.form.controls['Image'].setValue(this.FileURL);
    // }

    this._service.Post(this.form.value, url).subscribe({
      next: (result: any) => {
        
        if (result.status) {
          this.clearForm();
          this.closeModal();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetUsersList();
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
          console.log(this.RolesList)
        }
      },
      error: (err: any) => { },
    });
  }
  GetUsersList() {

    let url = this.baseUrl + 'GetUsersList';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.UsersList = result.data;
          for (let i = 0; i < this.UsersList.length; i++) {
            
            if (this.UsersList[i].image) {
              debugger
              this.UsersList[i].smallImage = this.configService.config.baseUrl + this.UsersList[i].image;
            }
            else {
              this.UsersList[i].smallImage = 'image';
            }
          }
          this.rerender();
        } else {

          this.toastr.error(result.message);
        }
      },
      error: (err: any) => { },
    });
  }

  clearForm() {
    this.submitted = false;
    this.isUpdate = false;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    this.FileURL = ''
    this.form.reset({
      Id: 0,
      RoleId: null
    });
    //this.form.controls.BranchID.setValue(0);
    //this.form.controls['RoleID'].setValue(0);
    this.showModal = false;
  }
  omitSpecialCharacterAndSpace(event: any) {

    if (event.code === 'Space') {
      return false
    }
    return this._inputField.omit_special_char(event);
  }
  onlyNumber(event: any) {

    return this._inputField.numberOnly(event);
  }

  async onFileChange(event: any, fileInputRef: HTMLInputElement) {
    const base64: any = await this._sharedHelper.preview(event.target.files, 'image');
    
    if (base64) {
      this.form.controls['Image'].setValue(base64);
      this.FileURL = base64; // Optional: For <img [src]="previewImage">
    } else {
      this.toastr.error("Invalid file. Only JPG/PNG under 10MB allowed.");
      if (fileInputRef) fileInputRef.value = '';
    }
  }
  Update(data: any) {
    
    this.isUpdate = true;
    this.form.controls['Id'].setValue(data['id']);
    this.form.controls['FirstName'].setValue(data['firstName']);
    this.form.controls['LastName'].setValue(data['lastName']);
    this.form.controls['Email'].setValue(data['email']);
    // this.form.controls['UserCode'].setValue(data['userCode']);
    this.form.controls['Password'].setValue(data['password']);
    this.form.controls['HomeAddress'].setValue(data['homeAddress']);
    this.form.controls['OfficeAddress'].setValue(data['officeAddress']);
    this.form.controls['MobileNo'].setValue(data['mobileNo']);
    this.form.controls['TelNo'].setValue(data['telNo']);

    this.modelRoleId = parseInt(data['roleId'])
    this.form.controls['RoleId'].setValue(this.modelRoleId);
    this.form.controls['CreatedBy'].setValue(data['createdBy']);
    this.form.controls['CreatedDate'].setValue(data['createdDate']);
    this.form.controls['UpdatedBy'].setValue(data['updatedBy']);
    this.form.controls['UpdatedDate'].setValue(data['updatedDate']);
    this.form.controls['IsActive'].setValue(data['isActive']);
    this.form.controls['LocationName'].setValue(data['locationName']);
    this.FileURL = data['image'];
    this.form.controls['Image'].setValue(data['image']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.showModal = true;
  }

  openAdd() {
    this.clearForm();
    this.isUpdate = false;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next(null);
    });
  }
}
