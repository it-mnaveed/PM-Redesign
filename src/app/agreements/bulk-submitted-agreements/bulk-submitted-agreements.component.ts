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
import { ExcelExportService } from '../../_services/excel-export.service';

@Component({
  selector: 'app-bulk-submitted-agreements',
  templateUrl: './bulk-submitted-agreements.component.html',
  styleUrls: ['./bulk-submitted-agreements.component.css']
})
export class BulkSubmittedAgreementsComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  searchData = "";
  RecordCount: any;
  showForm: boolean = false;
  addBreadcrumb: boolean = false;
  showHidetable: boolean = true;

  p: any;
  CurrentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  AgreementList: any;
  AllowedPermissions: any;
  SelectedAgreement: any = {};
  activeTab: string;
  UnitactiveTab: string = 'Facilities';
  GenericForma: { DateFormate: string; };
  AgreementTypeListVlaues: any;
  agreementUtilities: any;
  agreementItemFacilities: any;
  AgreementActionsPermissions: any;
  MeteredUtilities: any = [];
  SelectedItemMaintenanceBillHistory: any;
  showSubmissionButton: boolean;
  showAcceptenceButton: boolean;
  NewBillItemUnitCode: any;
  historyBillItemUnitCode: any;

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
    private router: Router,
    private expExcel: ExcelExportService

  ) {
    this.AllowedPermissions = this._permService.getPermissions();
    this.GenericForma = this._sharedHelper.getGenericFormate();


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
      scrollX: true
      // autoWidth: false,
      //   columnDefs: [
      //     { targets: '_all', width: 'auto' }
      //   ]

      // autoWidth: false
    };

    this.GetSubmittedAgreements();
    this.enumService.getAgreementTypes().subscribe(types => {
      this.AgreementTypeListVlaues = types;
    });

    this.enumService.getAgreementActions().subscribe(actions => {
      this.AgreementActionsPermissions = actions;
    });
    //this.GetLovs();
  }
  GetAgreementDetail(Id: any = 0, isMeteredBill = false) {

    let url = '/Agreement/agreement?Id=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          if (Id > 0) {
            
            this.SelectedAgreement = result.data[0];
            for (let i = 0; i < this.SelectedAgreement.agreementAttachments.length; i++) {
              if (this.SelectedAgreement.agreementAttachments[i].u_AttName) {

                this.SelectedAgreement.agreementAttachments[i].FileURL2 = this.configService.config.baseUrl + this.SelectedAgreement.agreementAttachments[i].u_AttName;
              }
            }
            if (this.SelectedAgreement.approvalStatus == 'Approved') {
              
              if (this.AgreementActionsPermissions.quotation) {
                this.SelectedAgreement.quotationPermission = true;
              }
              if (this.AgreementActionsPermissions.acceptance) {
                this.SelectedAgreement.acceptancePermission = true;
              }
              if (this.AgreementActionsPermissions.cancelation) {
                this.SelectedAgreement.cancelationPermission = true;
              }
              //-----------------Button Permissions----------------

              this.showSubmissionButton = true;
              this.showAcceptenceButton = false;
              if (this.SelectedAgreement.u_AGStatus === 2) {
                // ✅ When status is "Submitted"
                this.showSubmissionButton = false;
                this.showAcceptenceButton = true;

              } else if (this.SelectedAgreement.u_AGStatus === 3) {
                // ✅ For all other statuses
                this.showSubmissionButton = false;
                this.showAcceptenceButton = false;
              }
              //-----------------End Button Permissions------------
            }


            this.activeTab = 'General';
            if (isMeteredBill) {
              this.activeTab = 'NewBill';
              this.MeteredUtilities = [];
              ($('#meteredBillModal') as any).modal('show');
            } else {
              ($('#detailModal') as any).modal('show');
            }


            return;
          }
          // this.AgreementList = result.data;

        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => { },
    });
  }

  GetSubmittedAgreements() {

    let url = '/Agreement/GetAgreementsByStatus?status=2';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {

          this.AgreementList = result.data.sort((a: any, b: any) => {
            return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
          });

          
          this.rerender();
        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
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

        } else {

          this.toastr.error(result.message, "Error", {
            progressBar: true,
            closeButton: true
          });
        }
      },
      error: (err: any) => { },
    });
  }

  Update(agreementId: any) {
    let forward = {
      Id: agreementId
    }
    this.router.navigate(['/agreements/sale-agreement'], { state: { forward } });
  }
  UpdateAgreementStatus() {
    let PostedData = this.AgreementList
      .filter((item: any) => item.isSelected)
    if (PostedData.length == 0) {
      this.toastr.warning("Please select atleast one record to post!", "Warning");
      return;
    }
    let url = '/Agreement/BulkAgreementQuotationAcceptence';
    this._service.Post(PostedData, url).subscribe({
      next: (result: any) => {
        if (result.status) {

          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.GetSubmittedAgreements();
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
  loadAgreementDetails(data: any) {

    this.agreementUtilities = data.agreementUtilities || [];

    this.agreementItemFacilities = data.agreementItemFacilities || [];
    ($('#utilFacilModal') as any).modal('show');
  }
  selectAll: boolean = false;

  toggleSelectAll(event: any) {
    this.selectAll = event.target.checked;
    this.AgreementList.forEach((item: any) => (item.isSelected = this.selectAll));
  }

  checkIfAllSelected() {
    this.selectAll = this.AgreementList.every((item: any) => item.isSelected);
  }
  exportDataDetail() {
    
    if (!this.AgreementList || this.AgreementList.length == 0) {
      this.toastr.info("There is no data available to export!", "Info");
      return;
    }
    this.expExcel.exportToExcel(this.AgreementList, 'BulkAgreementAcceptance')
  }
}