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
import { ExcelExportService } from '../../_services/excel-export.service';

@Component({
  selector: 'app-revenue-posting-list',
  templateUrl: './revenue-posting-list.component.html',
  styleUrls: ['./revenue-posting-list.component.css']
})
export class RevenuePostingListComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective, { static: false })
  dtElement!: DataTableDirective;

  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();

  form: FormGroup;
  submitted: boolean = false;
  loading: boolean = false;
  isUpdate: boolean = false;
  RolesList: any;
  searchData = "";
  RecordCount: any;
  showForm: boolean = false;
  addBreadcrumb: boolean = false;
  showHidetable: boolean = true;
  baseUrl: any = '/RoleManagement/';
  p: any;
  SelectedAgreement: any = {};
  activeTab: string = 'UnitDetail';
  UnitactiveTab: string;
  CurrentUserInfo: any | { Id: number; UserCode: string; FullName: string; RoleName: string; RoleID: number; UserImage: string; };
  ReportsList: any;
  AllowedPermissions: any;
  datePickerConfig: any;
  bsInlineValue = new Date();
  LovsList: any;
  AgreementTypeListVlaues: any;
  AgreementList: any;
  GenericForma: { DateFormate: string; };
  currentStep: number = 1;
  totalSteps = 2;
  FileURL: any;
  TotalAmountOfSelectedAgreement: any = 0;
  showModal: boolean = false;
  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
    private labelHelper: FormLabelHelper,
    private el: ElementRef,
    private renderer: Renderer2,
    private _permService: PermissionsSharingService,
    private expExcel: ExcelExportService,
    private enumService: EnumService
  ) {
    this.AllowedPermissions = this._permService.getPermissions();
    this.datePickerConfig = this._sharedHelper.getDateConfiguration();
    this.GenericForma = this._sharedHelper.getGenericFormate();
  }
  ngAfterViewInit(): void {
    this.dtTrigger.next(null);
    this.labelHelper.markRequiredFields(this.form, this.el, this.renderer);
  }

  rerender(): void {
    if (!this.dtElement) return;
    this.dtElement.dtInstance?.then((dtInstance: DataTables.Api) => {
      dtInstance.destroy();
      this.dtTrigger.next(null);
    });
  }

  ngOnDestroy(): void {
    this.dtTrigger.unsubscribe();
  }
  ngOnInit(): void {

    this.enumService.getAgreementTypes().subscribe(types => {
      this.AgreementTypeListVlaues = types;
    });

    this.dtOptions = {
      pagingType: 'full_numbers',
      pageLength: 10,
      processing: true,
      ordering: true,
      scrollX: true
    };

    this.GetRevenueList();
  }

  openAdd() {
    if (this.AllowedPermissions && this.AllowedPermissions['canCreate']) {
      this.SelectedAgreement = {};
      this.showModal = true;
    } else {
      this.toastr.error("You don't have permission to create Posting", "Permission Denied", {
        progressBar: true,
        closeButton: true
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.GetRevenueList();
  }

  GetRevenueList(Id: any = 0,) {
    debugger
    let url = '/RevenuePosting/GetRevenuePostings?id=' + Id + '&type=Revenue';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          if (Id > 0) {
            this.SelectedAgreement = result.data;
            console.log(JSON.stringify(this.SelectedAgreement.revenueDetails))
            
            this.TotalAmountOfSelectedAgreement = this.SelectedAgreement?.revenueDetails
              ?.reduce((sum: number, item: any) => sum + (Number(item.u_Amt) || 0), 0) || 0;
            ($('#detailModal') as any).modal('show');
            return;
          }
          this.ReportsList = result.data;

          this.rerender();
        }else{
          this.toastr.error(result.message, "Error");
        }
      },
      error: (err: any) => { },
    });
  }
  exportDataDetail() {
    
    if (!this.SelectedAgreement || this.SelectedAgreement.length == 0) {
      this.toastr.info("There is no data available to export!", "Info");
      return;
    }

    const excelData = this.flattenRevenueData(this.SelectedAgreement);
    this.expExcel.exportToExcel(excelData, 'RevenuePostingDetail')
  }
  exportData() {
    if (!this.ReportsList || this.ReportsList.length == 0) {
      this.toastr.info("There is no data available to export!", "Info");
      return;
    }
    this.expExcel.exportToExcel(this.ReportsList, 'RevenuePostingList')
  }
  flattenRevenueData(header: any): any[] {
    const details = header.revenueDetails || [];

    return details.map((d: any) => ({
      // 🔹 Header fields (repeated in each row)
      Id: header.id,
      DocNum: header.u_DocNum,
      Series: header.series,
      AGType: header.agType,
      FromBPCode: header.u_FBPCode,
      ToBPCode: header.u_TBPCode,
      PostingDate: header.u_PDate,
      DueDate: header.u_DDate,
      Type: header.type,
      CreatedDate: header.createdDate,
      CreatedBy: header.createdByName,
      // 🔹 Detail fields
      DetailId: d.id,
      AGID: d.u_AGID,
      AGDocNum: d.agDocNum,
      BPCode: d.agbp,
      BPName: d.agbpName,
      AGTypeDetail: d.agType,
      RevRecID: d.u_RevRecID,
      RevRecDocNum: d.revRecDocNum,
      Amount: d.u_Amt,
      RevenueJE: d.u_RevJE,
      ARInvoiceDoc: d.u_ARInvDoc
    }));
  }

}