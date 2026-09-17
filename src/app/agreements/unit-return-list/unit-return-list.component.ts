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
import { Router } from '@angular/router';
import { EnumService } from '../../_services/enum.service';
import { ExcelExportService } from '../../_services/excel-export.service';

@Component({
  selector: 'app-unit-return-list',
  templateUrl: './unit-return-list.component.html',
  styleUrls: ['./unit-return-list.component.css']
})
export class unitreturnlistComponent implements OnInit, AfterViewInit {
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
  PerformaList: any;
  AllowedPermissions: any;
  SelectedAgreement: any = {};
  activeTab: string = "UnitDetail";
  UnitactiveTab: string = '';
  GenericForma: { DateFormate: string; };
  AgreementTypeListVlaues: any;
  SeriesList: any;
  AgreementList: any;
  TaxCodesList: any;
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
    private configService: ConfigService,
    private router: Router,
    private enumService: EnumService,
    private expExcel:ExcelExportService
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
    };
    this.enumService.getAgreementTypes().subscribe(types => {
      this.AgreementTypeListVlaues = types;
    });
    this.GetUnitReturnList()
    //this.GetLovs();

  }
  openAdd() {
    if (this.AllowedPermissions && this.AllowedPermissions['canCreate']) {
      // Clear any previously selected data so the form opens fresh
      this.SelectedAgreement = {};
      this.showModal = true;
    } else {
      this.toastr.error("You don't have permission to create Unit Return", "Permission Denied", {
        progressBar: true,
        closeButton: true
      });
    }
  }

  closeModal() {
    this.showModal = false;
    this.GetUnitReturnList();
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
              // Open the embedded modal and pass SelectedAgreement to the form component for editing
              // toggle modal off/on to ensure child receives fresh input and renders correctly
              this.showModal = false;
              setTimeout(() => { this.showModal = true; }, 0);
              return;
            }

            this.activeTab = 'UnitDetail';
            ($('#detailModal') as any).modal('show');
            return;
          }
          // this.PerformaList = result.data;
          this.PerformaList = result.data.sort((a: any, b: any) => {
            return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
          });
          this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
  GetFilterSuspensionByAgreementType(AgreementID: any = 0) {

    let url = '/Suspension/suspension?id= 0&agrType=' + AgreementID;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {

          // this.PerformaList = result.data;
          this.PerformaList = result.data.sort((a: any, b: any) => {
            return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
          });
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
          //  this.AgreementTypeListVlaues = result.data.filter((item: any) => item.field === 'AgreementType');

        }
      },
      error: (err: any) => { },
    });
  }
  onDropDownChange(data: 0) {
    
    this.GetUnitReturnList()
    //this.GetFilterSuspensionByAgreementType(data);
  }

  GetDocSeries(agrId: any) {
    let url = `/MasterData/GetDocSeries?agrmntId=${agrId}&docType=6`;
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.SeriesList = result.data;
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
          if (Id > 0) {
            this.SelectedAgreement = result.data[0];
          }
          this.AgreementList = result.data;

          // this.rerender();
        }
      },
      error: (err: any) => { },
    });
  }
  Update(DId: any) {
    debugger
    this.GetUnitReturnList(DId, true);

  }
  exportData() {
    if (!this.PerformaList || this.PerformaList.length == 0) {
      this.toastr.info("There is no data available to export!", "Info");
      return;
    }
    this.expExcel.exportToExcel(this.PerformaList, 'UnitReturnList')
  }
}