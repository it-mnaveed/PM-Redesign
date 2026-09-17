import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { PermissionsSharingService } from '../../_services/permissionsharing.service';
import { ExcelExportService } from '../../_services/excel-export.service';

@Component({
  selector: 'app-bulk-installments-list',
  templateUrl: './bulk-installments-list.component.html',
  styleUrls: ['./bulk-installments-list.component.css']
})
export class BulkInstallmentsListComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  form: FormGroup;
  submitted: boolean;
  loading: boolean;
  isUpdate: boolean;
  RolesList: any;
  searchData = "";
  RecordCount: any;
  showForm: boolean = false;
  addBreadcrumb: boolean = false;
  showHidetable: boolean = true;
  baseUrl: any = '/RoleManagement/';
  p: any;
  CurrentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  SAPSettingList: any;
  AllowedPermissions: any;
  BulkInstallmentsList: any;
  GenericForma: { DateFormate: string; };
  SelectedAgreement: any = {};
  showModal: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
    private expExcel: ExcelExportService,
    private _permService: PermissionsSharingService
  ) {
    this.AllowedPermissions = this._permService.getPermissions();
    this.GenericForma = this._sharedHelper.getGenericFormate();
  }


  ngAfterViewInit(): void {
    this.dtTrigger.next(null); // no need to pass 0
    // this.labelHelper.markRequiredFields(this.form, this.el, this.renderer);
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
    };

    this.GetBulkInstallments();
  }

  openAdd() {
    if (this.AllowedPermissions && this.AllowedPermissions['canCreate']) {
      this.showModal = true;
    } else {
      this.toastr.error("You don't have permission to create Bulk Installments", "Permission Denied", {
        progressBar: true,
        closeButton: true
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.GetBulkInstallments();
  }

  get f() { return this.form.controls; }

  GetBulkInstallments(Id: any = 0) {

    let url = `/RevenuePosting/GetRevenuePostings?Id=${Id}&Type=Installments`;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          if (Id > 0) {
            this.SelectedAgreement = result.data;
            console.log(JSON.stringify(this.SelectedAgreement.invoiceDetails))
            this.calculateInvoiceTotals();
            ($('#detailModal') as any).modal('show');

          } else {
            this.BulkInstallmentsList = result.data;

            this.rerender();
          }

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

  totalBeforeTax: number = 0;
  totalUtilAmt: number = 0;
  totalTax: number = 0;
  totalAfterTax: number = 0;
  totalAmtReceived: number = 0;

  calculateInvoiceTotals() {
    const itemsAll = this.SelectedAgreement?.invoiceDetails || [];

    const items = itemsAll.filter((x: any) => x.u_ProfSent === 'Y');

    this.totalBeforeTax = items.reduce((sum: any, x: any) => sum + (Number(x.u_AmtBeforeTax) || 0), 0);
    this.totalUtilAmt = items.reduce((sum: any, x: any) => sum + (Number(x.u_UtilAmt) || 0), 0);
    this.totalTax = items.reduce((sum: any, x: any) => sum + (Number(x.u_Tax) || 0), 0);
    this.totalAfterTax = items.reduce((sum: any, x: any) => sum + (Number(x.u_AmtAfterTax) || 0), 0);
    this.totalAmtReceived = items.reduce((sum: any, x: any) => sum + (Number(x.u_AmtRcvd) || 0), 0);
  }
  exportData() {
    if (!this.BulkInstallmentsList || this.BulkInstallmentsList.length == 0) {
      this.toastr.info("There is no data available to export!", "Info");
      return;
    }
    
    this.expExcel.exportToExcel(this.BulkInstallmentsList, 'BulkInstallmentsList')
  }
  exportDataDetail() {
    
    if (!this.SelectedAgreement || this.SelectedAgreement.length == 0) {
      this.toastr.info("There is no data available to export!", "Info");
      return;
    }
    console.log(JSON.stringify(this.SelectedAgreement))
    const excelData = this.flattenForExcel(this.SelectedAgreement);
    this.expExcel.exportToExcel(excelData, 'BulkInstallmentDetail')
  }

  flattenForExcel(header: any): any[] {
  const details = header.invoiceDetails || [];

  return details.map((d: any) => ({
    // Header columns
    DocNum: header.u_DocNum,
    Series: header.series,
    PostingDate: header.u_PDate,
    DueDate: header.u_DDate,

    // Detail columns
    InstID: d.u_InstID,
    AGID: d.u_AGID,
    SAPDocNum: d.sapDocNum,
    BPCode: d.agbp,
    BPName: d.agbpName,
    AmountBeforeTax: d.u_AmtBeforeTax,
    Tax: d.u_Tax,
    AmountAfterTax: d.u_AmtAfterTax,
    ProfSent: d.u_ProfSent
  }));
}

}