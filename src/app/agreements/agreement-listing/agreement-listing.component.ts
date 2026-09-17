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
  selector: 'app-agreement-listing',
  templateUrl: './agreement-listing.component.html',
  styleUrls: ['./agreement-listing.component.css']
})
export class AgreementListingComponent implements OnInit, AfterViewInit {

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
  GenericForma: any;
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
  AttachmentType: any;
  Description: any;
  FileURL: any;
  AttachmentTypeListValues: any;

  constructor(
    private enumService: EnumService,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
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
      scrollX: true,
      autoWidth: false,
      //   columnDefs: [
      //     { targets: '_all', width: 'auto' }
      //   ]
      // autoWidth: false
    };

    this.GetAgreementFilterList();
    this.enumService.getAgreementTypes().subscribe(types => {
      this.AgreementTypeListVlaues = types;
    });

    this.enumService.getAgreementActions().subscribe(actions => {
      this.AgreementActionsPermissions = actions;
    });
    this.GetLovs();
  }
  GetAgreementList(Id: any = 0, isMeteredBill = false) {

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
  GetAgreementFilterList(Id: any = 0) {

    let url = '/Agreement/agreements?agrType=' + Id;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          
          this.AgreementList = result.data.sort((a: any, b: any) => {
            return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
          });
          console.log(JSON.stringify(this.AgreementList))
          this.rerender();
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
          this.AttachmentTypeListValues = result.data.filter((item: any) => item.field === 'AttachmentType');
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
  onDropDownChange(data: any) {
    debugger
    this.GetAgreementFilterList(data);
  }
  Update(agreementId: any) {
    let forward = {
      Id: agreementId
    }
    this.router.navigate(['/agreements/sale-agreement'], { state: { forward } });
  }
  UpdateAgreementStatus(AgStatus: any, yesCancel: string = '') {
    if (AgStatus == 4 && !yesCancel) {
      ($('#cancelConfirmModal') as any).modal('show');
      return;
    }
    let Id = this.SelectedAgreement.id;
    let url = `/Agreement/updateagreementstatus?Id=${Id}&AgrStatus=${AgStatus}`;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.GetAgreementFilterList();
          ($('#detailModal') as any).modal('hide');
          ($('#cancelConfirmModal') as any).modal('hide');
          this.toastr.success(result.message, "Success")
        } else {
          this.toastr.error(result.message, "Error")
        }
      },
      error: (err: any) => { },
    });
  }
  loadAgreementDetails(data: any) {

    this.agreementUtilities = data.agreementUtilities || [];

    this.agreementItemFacilities = data.agreementItemFacilities || [];
    ($('#utilFacilModal') as any).modal('show');
  }

  loadMeteredItems(unitCode: any) {
    
    const exist = this.SelectedAgreement.agreementItems.find((m: any) => m.u_UnitCode == unitCode);
    if (exist) {
      const currentHistory = exist.agreementMaintenceBills || [];

      this.MeteredUtilities = exist.agreementUtilities
        ?.filter((u: any) => u.u_Calculation === 3)
        .map((u: any) => {
          // Find last history record based on highest Id for this item
          const lastRecord = currentHistory
            .filter((h: any) => h.u_UtilItemCode === u.u_UtilItemCode)
            .sort((a: any, b: any) => b.id - a.id)[0];

          return {
            ...u,
            AgreementItemsId: exist.id,
            U_UDetailUtilLineID: u.id,
            name: u.utilItemname,
            U_PrReading: lastRecord ? lastRecord.u_CrReading : 0, // previous reading from last record
            CreatedBy: parseInt(this.CurrentUserInfo.Id)
          };
        }) || [];
    }
  }

  loadHistory(unitCode: any) {
    
    let exist = this.SelectedAgreement.agreementItems.find((m: any) => m.u_UnitCode == unitCode);
    if (exist) {
      this.SelectedItemMaintenanceBillHistory = exist.agreementMaintenceBills;
    }
  }
  onReadingChange(p: any): void {
    // Ensure values are numeric and handle invalid input gracefully
    const prev = Number(p.U_PrReading) || 0;
    const curr = Number(p.U_CrReading) || 0;

    // Calculate consumption (ensure it’s never negative)
    p.U_Consumed = curr >= prev ? curr - prev : 0;

    // Optionally recalculate amount and tax if needed
    p.U_AmtBeforeTax = p.U_Consumed * (Number(p.u_Rate) || 0);

    const taxRate = Number(p.U_TaxPrc || p.u_TaxPrc || 0);
    p.U_Tax = (p.U_AmtBeforeTax * taxRate) / 100;
    p.U_AmtAfterTax = p.U_AmtBeforeTax + p.U_Tax;
  }
  SaveAgreementMeteredBill() {
    let postedData = this.MeteredUtilities
      ?.filter((u: any) => u.U_CrReading > 0)
      .map((u: any) => ({
        ...u,
        Id: 0
      })) || [];

    if (postedData.length === 0) {
      this.toastr.warning("Please fill atleast one item", "Warning");
      return;
    }
    let invalidReadings = this.MeteredUtilities?.filter(
      (u: any) => u.U_CrReading < (u.U_PrReading || 0)
    );

    if (invalidReadings && invalidReadings.length > 0) {
      this.toastr.warning('Current reading cannot be less than previous reading.');
      return;
    }

    let url = '/Agreement/PostRentMeteredBills';
    this._service.Post(postedData, url).subscribe({
      next: (result: any) => {
        if (result.status) {

          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });
          this.SelectedAgreement = {};
          this.NewBillItemUnitCode = '';
          this.historyBillItemUnitCode = '';
          this.SelectedItemMaintenanceBillHistory = [];
          this.GetAgreementFilterList();
          ($('#meteredBillModal') as any).modal('hide');

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
  exportData() {
    if (!this.AgreementList || this.AgreementList.length == 0) {
      this.toastr.info("There is no data available to export!", "Info");
      return;
    }
    this.expExcel.exportToExcel(this.AgreementList, 'AgreementsList')
  }
  AddRemoveAttachments(action: any, postdata: any) {

    if (action === 'add') {
      if (!this.AttachmentType || !this.Description || !this.FileURL) {
        this.toastr.warning("All fields are required", "Warning");
        return;
      }
      let data = {
        U_DType: this.AttachmentType,
        Name: this.Description,
        U_AttName: this.FileURL,
        TrnsAgreementId: this.SelectedAgreement.id
      }
      let url = '/Agreement/AddAttachment';
      this._service.Post(data, url).subscribe({
        next: (result: any) => {
          if (result.status) {
            
            this.AttachmentType = "";
            this.Description = "";
            this.FileURL = "";
            this.toastr.success(result.message, "Success", {
              progressBar: true,
              closeButton: true
            });
            let newData = {

              FileURL2: this.configService.config.baseUrl + result.data.u_AttName,
              u_DType: result.data.u_DType,
              name: result.data.name
            }
            this.SelectedAgreement.agreementAttachments.push(newData)
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
  }
  async onFileChange(event: any, fileInputRef: HTMLInputElement) {
    const base64: any = await this._sharedHelper.preview(event.target.files, 'image');

    if (base64) {
      this.FileURL = base64; // Optional: For <img [src]="previewImage">
    } else {
      this.toastr.error("Invalid file format. Only JPG/PNG/pdf under 10MB allowed.");
      if (fileInputRef) fileInputRef.value = '';
    }
  }
}