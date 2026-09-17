import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { PermissionsSharingService } from '../../_services/permissionsharing.service';
import { ConfigService } from '../../_services/LoadConfigFile';
import { EnumService } from '../../_services/enum.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-pending-agreement-listing',
  templateUrl: './pending-agreement-listing.component.html',
  styleUrls: ['./pending-agreement-listing.component.css']
})
export class PendingAgreementListingComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  searchData = "";
  RecordCount: any;
  showForm: boolean = false;
  addBreadcrumb: boolean = false;
  showHidetable: boolean = true;
  ApprovalRemarks: any;
  p: any;
  CurrentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  AgreementList: any;
  AllowedPermissions: any;
  SelectedAgreement: any = {};
  activeTab: string;
  UnitactiveTab: string;
  GenericForma: { DateFormate: string; };
  AgreementTypeListVlaues: any;
  PendingDocumentList: any;
  SelectedAgreementsup: any= {};
  constructor(
    private enumService: EnumService,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
    private labelHelper: FormLabelHelper,
    private el: ElementRef,
    private renderer: Renderer2,
    private _permService: PermissionsSharingService,
    private configService: ConfigService,
    private router: Router

  ) {
    this.AllowedPermissions = this._permService.getPermissions();
    this.GenericForma = this._sharedHelper.getGenericFormate();


  }
  ApproveApplication(status: any, DocType: any, DocId: any,DocNum:any = '') {
    let PostedData = {
      UserId: parseInt(this.CurrentUserInfo.Id),
      remarks: this.ApprovalRemarks,
      DocApprStatus: status,
      DocType: DocType,
      SubType: this.SelectedAgreement.agType,
      DocId: DocId,
      DocNum:DocNum
    }
    let url = '/DocumentApproval/Document-approval';
    this._service.Post(PostedData, url).subscribe({
      next: (result: any) => {
        if (result.status) {
         
           ($('#AgreementdetailModal') as any).modal('hide');
            ($('#PerformainvoicedetailModal') as any).modal('hide');
             ($('#UnitReturndetailModal') as any).modal('hide');
              ($('#OwnershipTransferdetailModal') as any).modal('hide');
               ($('#SuspensiondetailModal') as any).modal('hide');
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetPendingDocuments("");
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

  ngAfterViewInit(): void {
    this.dtTrigger.next(null); // no need to pass 0

  }

  ngOnDestroy(): void {
    // ✅ Prevent memory leaks
    this.dtTrigger.unsubscribe();

  }
  rerender(): void {
    this.dtElement.dtInstance.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next(null);
    });
  }
  ngOnInit(): void {
    this.CurrentUserInfo = this._sharedHelper.getCurrentUserInfo();

    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10,
      processing: true,
      ordering: true,
      // autoWidth:false,
      // scrollCollapse: true,
      scrollX: true
    };

    this.GetPendingDocuments("");
    this.enumService.getAgreementTypes().subscribe(types => {
      this.AgreementTypeListVlaues = types;
    });
    //this.GetLovs();
  }
  GetAgreementList(Id: any = 0) {

    let url = '/Agreement/agreement?Id=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          if (Id > 0) {
            
            this.SelectedAgreement = result.data[0];
            for (let i = 0; i < this.SelectedAgreement.agreementAttachments.length; i++) {
              if (this.SelectedAgreement.agreementAttachments[i].u_AttName) {
                debugger
                this.SelectedAgreement.agreementAttachments[i].FileURL2 = this.configService.config.baseUrl + this.SelectedAgreement.agreementAttachments[i].u_AttName;
              }
            }
            this.activeTab = 'General';
            ($('#AgreementdetailModal') as any).modal('show');
           
            return;
          }
          this.AgreementList = result.data;
       
          this.AgreementList = result.data.map((x: any) => {
            return {
              ...x,
              createdDate: x.createdDate ? new Date(x.createdDate) : null
            };
          });
          
          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }

  GetAgreementFilterList(Id: any = 0) {

    let url = '/Agreement/agreements?agrType=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.AgreementList = result.data.sort((a: any, b: any) => {
            return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
          });
          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
  GetPendingDocuments(Id: any) {
    
    let UserId = parseInt(this.CurrentUserInfo.Id);
    let url = '/DocumentApproval/getPendingDocuments?userid=' + UserId;

    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.PendingDocumentList = result.data.sort((a: any, b: any) => {
            return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
          });
           // Filter after fetching
        if (Id!="") {
          this.PendingDocumentList = this.PendingDocumentList.filter(
            (item: any) => item.docType === Id
          );
        } 
          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
  switchTab(tabName: string, tabType: string) {
    if (tabType == 'header') {
      this.activeTab = tabName;
    } else {
      this.UnitactiveTab = tabName;
    }

  }
  GetLovs() {

    let url = '/MasterData/GetLovs?Form=SaleAgreement';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          //this.AgreementTypeListVlaues = result.data.filter((item: any) => item.field === 'AgreementType');

        }
      },
      error: (err: any) => { },
    });
  }
  onDropDownChange(data: any) {
    // debugger
    this.GetPendingDocuments(data);
    
    
  }
  Update(agreementId: any) {
    let forward = {
      Id: agreementId
    }
    this.router.navigate(['/agreements/sale-agreement'], { state: { forward } });
  }
  GetDocumentDetail(docType: any, DocId: any) {
    
    if (docType == 'Agreement') {
      this.GetAgreementList(DocId);
    } else if (docType == 'Proforma Invoice') {
      this.GetperformaList(DocId);
    }else if (docType == 'Unit Return') {
      this.GetUnitReturnList(DocId);
    }
    else if (docType == 'Ownership Transfer') {
      this.GettransferList(DocId);
    }
    else if (docType == 'Suspension') {
      this.GetSuspensionList(DocId);
    }

  }
  GetperformaList(Id: any = 0, isUpdate = false) {

    let url = '/PerformaInvoice/proformaninvoicedetail?Id=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          
          if (Id > 0) {
            this.SelectedAgreement = result.data[0];
            if (this.SelectedAgreement.attachements) {
              for (let i = 0; i < this.SelectedAgreement.attachements.length; i++) {
                if (this.SelectedAgreement.attachements[i].u_Path) {
                  debugger
                  this.SelectedAgreement.attachements[i].FileURL2 = this.configService.config.baseUrl + this.SelectedAgreement.attachements[i].u_Path;
                }
              }
            }
            if (isUpdate) {
              let forward = {
                data: { ...this.SelectedAgreement }
              }
              console.log(forward)
              this.router.navigate(['/agreements/performa-invoice'], { state: { forward } });
              return;
            }
            this.activeTab = 'UnitDetail';
            ($('#PerformainvoicedetailModal') as any).modal('show');
            return;
          }
          //  this.PerformaList = result.data;


        }
      },
      error: (err: any) => { },
    });
  }
  GetUnitReturnList(Id: any = 0, isUpdate = false) {

    let url = '/UnitReturn/unitReturn?id=' + Id
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          debugger
          if (Id > 0) {
            this.SelectedAgreement = result.data[0];
            if (this.SelectedAgreement.attachments) {
              for (let i = 0; i < this.SelectedAgreement.attachments.length; i++) {
                if (this.SelectedAgreement.attachments[i].filePath) {
                  debugger
                  this.SelectedAgreement.attachments[i].FileURL2 = this.configService.config.baseUrl + this.SelectedAgreement.attachments[i].filePath;
                }
              }
            }
            if (isUpdate) {
              let forward = {
                data: { ...this.SelectedAgreement }
              }

              this.router.navigate(['/agreements/unit-return'], { state: { forward } });
              return;
            }

            this.activeTab = 'UnitDetail';
            ($('#UnitReturndetailModal') as any).modal('show');
            return;
          }

        }
      },
      error: (err: any) => { },
    });
  }
   GettransferList(Id: any = 0, isUpdate = false) {
    debugger
    let url = '/Agreement/gettransfer?Id=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          if (Id > 0) {
            this.SelectedAgreement = result.data[0];
            
            if (this.SelectedAgreement.attachements) {
              for (let i = 0; i < this.SelectedAgreement.attachements.length; i++) {
                if (this.SelectedAgreement.attachements[i].u_Path) {
                  debugger
                  this.SelectedAgreement.attachements[i].FileURL2 = this.configService.config.baseUrl + this.SelectedAgreement.attachements[i].u_Path;
                }
              }
            }
            if (isUpdate) {
              let forward = {
                data: { ...this.SelectedAgreement }
              }
             // console.log(forward)
              this.router.navigate(['/agreements/ownership-transfer'], { state: { forward } });
              return;
            }
    
            this.activeTab = 'UnitDetail';
            ($('#OwnershipTransferdetailModal') as any).modal('show');
            return;
          }
         
          // this.PerformaList = result.data.sort((a: any, b: any) => {
          //   return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
          // });
      
          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
   GetSuspensionList(Id: any = 0) {
debugger
    let url = '/Suspension/suspension?id=' + Id
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          debugger
          if (Id > 0) {
            this.SelectedAgreementsup = result.data[0];
            
            if (this.SelectedAgreementsup.attachments) {
              for (let i = 0; i < this.SelectedAgreementsup.attachments.length; i++) {
                if (this.SelectedAgreementsup.attachments[i].filePath) {
                  debugger
                  this.SelectedAgreementsup.attachments[i].FileURL2 = this.configService.config.baseUrl + this.SelectedAgreementsup.attachments[i].filePath;
                }
              }
            }

           
            this.activeTab = 'UnitDetail';
            ($('#SuspensiondetailModal') as any).modal('show');
            return;
          }

        
          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
}