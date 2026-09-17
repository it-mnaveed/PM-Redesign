import { AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { SharedService } from '../../_services/shared.service';
import { DataTableDirective } from 'angular-datatables';
import { Subject } from 'rxjs';
import { SharedHelper } from '../../_Helper/SharedHelper';
import { FormLabelHelper } from '../../_Helper/form-lable-helper';
import { PermissionsSharingService } from '../../_services/permissionsharing.service';
import { keysToPascalCase } from '../../_Helper/keysToPascalCase'
import { Location } from '@angular/common';

@Component({
  selector: 'app-property-structure',
  templateUrl: './property-structure.component.html',
  styleUrls: ['./property-structure.component.css']
})
export class PropertyStructureComponent implements OnInit, AfterViewInit {

  @ViewChild(DataTableDirective)
  dtElement: DataTableDirective;
  dtOptions: DataTables.Settings = {};
  dtTrigger: Subject<any> = new Subject();


  form: FormGroup;
  projectForm: FormGroup;
  buildingForm: FormGroup;
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

  AllowedPermissions: any;
  PropertyStructure: any = {}
  currentStep = 1; // Start from first step
  totalSteps = 4;
  wizardForm!: FormGroup;
  activeTab = 'FloorDetail';
  BL_Floor: any;
  Zone_BL_Floor: any;
  Sub_Zone_BL_Floor: any;
  BuildingFloorList: any = [];
  datePickerConfig: any;
  bsInlineValue = new Date();
  BLsubmitted: boolean;
  ProjectListValues: any = [
    { id: 1, name: 'Project A', code: 1 },
    { id: 2, name: 'Project B', code: 2 },
    { id: 3, name: 'Project C', code: 3 }
  ]
  BuildingID: any;
  zoneID: any;
  zoneCode: any;
  PostedZoneList: any = [];
  FloorsList: any;
  PostedBuildingList: any = [];
  selectedBuildingForDeteal: any = {};
  PostedBuildingsInDBList: any = [];
  SelectedBuildingFloors: any = [];
  ZoneFloors: any = [];
  SelectedZoneFloors: any = [];
  SubZoneSecFloors: any = [];
  GenericForma: { DateFormate: string; };
  DimensionsList: any;
  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private _service: SharedService,
    private _sharedHelper: SharedHelper,
    private labelHelper: FormLabelHelper,
    private el: ElementRef,
    private el2: ElementRef,
    private renderer: Renderer2,
    private _permService: PermissionsSharingService,
    private location: Location
  ) {
    this.AllowedPermissions = this._permService.getPermissions();
    this.datePickerConfig = this._sharedHelper.getDateConfiguration();
    this.GenericForma = this._sharedHelper.getGenericFormate();
  }
  @ViewChild('projectFormEl', { static: false }) projectFormEl?: ElementRef;
  @ViewChild('buildingFormEl', { static: false }) buildingFormEl?: ElementRef;

  ngAfterViewInit(): void {
    this.dtTrigger.next(null); // no need to pass 0
    if (this.projectFormEl) {
      this.labelHelper.markRequiredFields(this.projectForm, this.projectFormEl, this.renderer);
    }
    // this.labelHelper.markRequiredFields(this.buildingForm, this.buildingFormEl, this.renderer);

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
      ordering: true
    };

    this.projectForm = this.fb.group({
      Id: [0], // usually hidden or auto-generated
      Name: ['', Validators.required],
      U_Code: ['', Validators.required],
      CreatedDate: [new Date()], // default current date
      UpdatedDate: [new Date()], // default current date
      CreatedBy: [parseInt(this.CurrentUserInfo.Id)],
      UpdatedBy: [parseInt(this.CurrentUserInfo.Id)]
    });
    this.buildingForm = this.fb.group({
      Id: [0], // hidden or auto-generated
      Name: ['', Validators.required],
      U_Code: ['', Validators.required],
      U_PrjCode: [null, Validators.required],
      CreatedDate: [new Date()], // default current date
      UpdatedDate: [new Date()], // default current date
      CreatedBy: [parseInt(this.CurrentUserInfo.Id)],
      UpdatedBy: [parseInt(this.CurrentUserInfo.Id)],
      ProjectId: [null, Validators.required],
      U_Dimen1: [''],
      U_Dimen2: [''],
      U_Dimen3: [''],
      U_Dimen4: [''],
      U_Dimen5: [''],
    });
    this.GetMasterDimensions();
    this.GetMasterData();
  }

  get f() { return this.form.controls; }
  onSubmit() {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }
    this.loading = true;

    let url = '/MasterData/PostSAPConnectionSettings';
    this._service.Post(this.form.value, url).subscribe({
      next: (result: any) => {
        if (result.status) {
          this.clearForm();
          this.toastr.success(result.message, "Success", {
            progressBar: true,
            closeButton: true
          });

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

  clearForm() {
    this.submitted = false;
    this.isUpdate = false;
    this.form.reset();
    this.form.patchValue({
      Id: 0,
      CreatedBy: parseInt(this.CurrentUserInfo.Id),
      UpdatedBy: parseInt(this.CurrentUserInfo.Id),
      CreatedDate: new Date(),
      UpdatedDate: new Date()
    });
  }
  Update(data: any) {
    
    this.form.patchValue({
      Id: data.id,
      SapUserName: data.sapUserName,
      SapPassword: data.sapPassword,
      SapServerAddress: data.sapServerAddress,
      SapDbName: data.sapDbName,
      SapDbType: data.sapDbType,
      DbUserName: data.dbUserName,
      DbPassword: data.dbPassword,
      DbName: data.dbName,
      DbServerName: data.dbServerName,
      ServiceLayerUrl: data.serviceLayerUrl,
      CreatedBy: data.createdBy,
      UpdatedBy: data.updatedBy,
      CreatedDate: data.createdDate,
      UpdatedDate: data.updatedDate
    });
  }
  getStepClass(step: number) {
    if (step < this.currentStep) {
      return 'completed';
    } else if (step === this.currentStep) {
      return 'active';
    } else {
      return 'pending';
    }
  }
  get pr() { return this.projectForm.controls; }
  get bl() { return this.buildingForm.controls; }
  nextStep() {
    if (this.currentStep < this.totalSteps) {
      
      if (this.currentStep === 1) {
        // Validate projectForm before moving to next step
        this.submitted = true;
        if (this.projectForm.invalid) {
          return; // Stop if the form is invalid
        }

        this.PostData(this.projectForm.value, '/PropertyStructure/postoprj', 'project', this.currentStep);
      } else if (this.currentStep === 2) {

        
        // let PostedData = [{
        //   ...this.buildingForm.value,
        //   BuildingFloors: this.BuildingFloorList,
        //   BuildingPropertyDetails: this.PlotList,
        // }];
        if (this.PostedBuildingList.length === 0) {
          this.toastr.warning("Warning", "Please add atleast one building!");
          return;
        }
        this.PostData(this.PostedBuildingList, '/PropertyStructure/postobld', 'building', this.currentStep);

      } else if (this.currentStep === 3) {
        if (this.ZoneList.length === 0) {
          this.toastr.warning("Warning", "Please add atleast one zone!");
          return;
        }
        this.PostData(this.ZoneList, '/PropertyStructure/postozon', 'zone', this.currentStep);
      }


      this.currentStep++;
      if (this.currentStep === 2) {
        setTimeout(() => {
          if (this.buildingFormEl) {
            this.labelHelper.markRequiredFields(this.buildingForm, this.buildingFormEl, this.renderer);
          }
        });
      }
    }
  }
  SubmitCompleteApplication() {
    if (this.currentStep === 4) {
      if (this.SubZoneList.length === 0) {
        this.toastr.warning("Warning", "Please add atleast one subzone!");
        return;
      }
      let PostedData = {
        oData: this.SubZoneList,
        ProjectId: this.projectForm.value.Id
      }
      
      this.PostData(PostedData, '/PropertyStructure/postosubzon', 'subzone', this.currentStep);
    }
  }
  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }
  switchTab(tabName: string) {
    this.activeTab = tabName;
  }

  PostData(values: any, url: any, form: any, currentStep: any) {
    {
      this._service.Post(values, url).subscribe({
        next: (result: any) => {
          if (result.status) {

            if (form === 'project') {
              
              //this.projectForm.reset();
              this.projectForm.patchValue({
                Id: result.data.id,
              });
              this.buildingForm.controls['U_PrjCode'].setValue(result.data.u_Code);
              this.GetProjects('/PropertyStructure/projects', result.data.id);
            } else if (form === 'building') {
              // this.buildingForm.patchValue({
              //   Id: result.data[0].id,
              //   U_Code: result.data[0].u_Code
              // });
              this.PostedBuildingsInDBList = result.data;
              this.PostedBuildingList = [];
              //this.PostedBuildingList = result.data;
              this.PostedBuildingList = keysToPascalCase(result.data);
            }
            else if (form === 'zone') {
              this.PostedZoneList = result.data;
              this.ZoneList = keysToPascalCase(result.data);
            } else {
              this.currentStep = 1;
              this.SubZoneList = [];
              this.projectForm.reset();
              this.toastr.success(result.message, "Success", {
                progressBar: true,
                closeButton: true
              });
            }
          } else {
            this.currentStep = currentStep;
            this.toastr.error(result.message, "Error", {
              progressBar: true,
              closeButton: true
            });
          }
        },
        error: (err: any) => {
          console.error(err);
          
          let errorMsg = "An unexpected error occurred";

          // Handle API error response
          if (err.error) {
            if (typeof err.error === 'string') {
              errorMsg = err.error; // plain text error
            } else if (err.error.message) {
              errorMsg = err.error.message; // JSON error with message
            } else if (err.message) {
              errorMsg = err.message;
            }
          }
          this.toastr.error(errorMsg, "Error", {
            progressBar: true,
            closeButton: true
          });

        },
      });
    }
  }
  GetProjects(url: any, id?: any) {
    url = '/PropertyStructure/projects?id=' + (id ? id : 0);
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.ProjectListValues = result.data;
          this.buildingForm.controls['ProjectId'].setValue(this.ProjectListValues[0].id)
        }
      },
      error: (err: any) => { },
    });
  }
  AddRemoveBuildingFloors(action: any, postdata: any) {
    
    if (action === 'add') {
      if (!Array.isArray(this.BL_Floor) || this.BL_Floor.length === 0) {
        this.toastr.warning("Please select at least one floor", "Warning");
        return;
      }
      this.BuildingFloorList = [];
      // Add each selected floor if not already in the list
      this.BL_Floor.forEach((floorCode: any) => {
        
        const floorObj = this.FloorsList.find((f: any) => f.code === floorCode);
        if (!floorObj) return;
        const exists = this.BuildingFloorList.some((m: any) => m.code === floorObj.code);
        if (!exists) {
          this.BuildingFloorList.push({ U_FlrCode: floorObj.code, Name: floorObj.name });
        }
      });
      
      // Optionally clear selection after adding
      this.BL_Floor = [];
    } else {
      this.BuildingFloorList = this.BuildingFloorList.filter((item: any) => item !== postdata);
    }

  }
  // Model for a plot row
  NewPlot: any = {
    PlotNo: '',
    PlotSize: '',
    PlotOwner: '',
    Deed: '',
    Status: 'Owned',
    AcquisitionDate: '',
    AcquisitionEndDate: ''
  };

  PlotList: any[] = [];

  AddRemovePlot(action: string, index: any) {
    if (action === 'add') {
      
      if (!this.NewPlot.U_PNo || !this.NewPlot.U_POwner || !this.NewPlot.U_PStatus || !this.NewPlot.U_AQSDate
        || !this.NewPlot.U_AQEDate
      ) {
        this.toastr.warning("Please fill in all required fields", "Warning");
        return;
      }

      // ensure U_BldCode and Name are set (backend model expects them)
      let newPlotItem = {
        ...this.NewPlot,
        U_BldCode: 1, // this.buildingForm?.value?.U_Code || null, // assuming buildingForm has been filled
        Name: this.NewPlot.Name || null                      // optional
      };

      this.PlotList.push(newPlotItem);

      // reset form row
      this.NewPlot = {
        U_PNo: '',
        U_PSize: '',
        U_POwner: '',
        U_Deed: '',
        U_PStatus: 1, // default = Owned
        U_AQSDate: null,
        U_AQEDate: null,
        U_BldCode: this.buildingForm?.value?.U_Code || null,
        Name: null
      };
    } else if (action === 'remove') {
      this.PlotList.splice(index, 1);
    }
  }
  // Options for Zone dropdown
  ZoneOptions: string[] = ['P2PH1-B1-Z01', 'P2PH1-B1-Z02', 'P2PH1-B1-Z03'];

  // New zone model
  NewZone: any = {
    U_Code: '',
    Name: '',
    U_BldCode: '',
    BuildingId: null,
    ZoneFloors: []
  };

  ZoneList: any[] = [];



  AddRemoveZoneFloors(action: any, postdata: any) {
    
    if (action === 'add') {
      if (!Array.isArray(this.Zone_BL_Floor) || this.Zone_BL_Floor.length === 0) {
        this.toastr.warning("Please select at least one floor", "Warning");
        return;
      }
      this.ZoneFloors = [];
      // Add each selected floor if not already in the list
      this.Zone_BL_Floor.forEach((floorCode: any) => {
        
        const floorObj = this.FloorsList.find((f: any) => f.code === floorCode);
        if (!floorObj) return;
        const exists = this.ZoneFloors.some((m: any) => m.U_FlrCode === floorObj.code);
        if (!exists) {
          this.ZoneFloors.push({ U_FlrCode: floorObj.code, Name: floorObj.name });
        }
      });
      
      // Optionally clear selection after adding
      this.Zone_BL_Floor = [];
    } else {
      this.ZoneFloors = this.ZoneFloors.filter((item: any) => item !== postdata);
    }

  }
  editingZoneIndex: number | null = null;
  AddRemoveZoneOld(action: string, index?: any) {
    
    if (action === 'add') {
      if (!this.NewZone.U_Code || !this.NewZone.Name) {
        this.toastr.warning("Please fill in all required fields", "Warning");
        return;
      }

      const building = this.PostedBuildingsInDBList.find((m: any) => m.id == this.NewZone.BuildingId);
      this.NewZone.U_BldCode = building?.u_Code || null;

      // Add selected floors
      this.AddRemoveZoneFloors('add', '');
      this.NewZone.ZoneFloors = this.ZoneFloors;

      // 🔹 Map dimension codes and names
      this.DimensionsList.forEach((dim: any) => {
        const dimCode = this.NewZone['U_Dimen' + dim.level];
        const dimValue = dim.values.find((v: any) => v.ocrCode === dimCode);
        this.NewZone['U_Dimen' + dim.level + '_Name'] = dimValue ? dimValue.ocrName : null;
      });

      // 🔹 Clone and push Zone data
      const zoneData = { ...this.NewZone };
      this.ZoneList.push(zoneData);

      // 🔹 Reset
      this.Zone_BL_Floor = [];
      this.NewZone = { Zone: '', U_Code: '', Name: '', ZoneFloors: [] };
    }
    else if (action === 'remove' && index !== undefined) {
      this.ZoneList.splice(index, 1);
    }
  }
  AddRemoveZone(action: string, index?: any) {
    

    if (action === 'add') {
      if (!this.NewZone.U_Code || !this.NewZone.Name) {
        this.toastr.warning("Please fill in all required fields", "Warning");
        return;
      }

      // Get building code
      const building = this.PostedBuildingsInDBList.find((m: any) => m.id == this.NewZone.BuildingId);
      this.NewZone.U_BldCode = building?.u_Code || null;

      // Add floors
      this.AddRemoveZoneFloors('add', '');
      this.NewZone.ZoneFloors = this.ZoneFloors;

      // Add dimension names
      this.DimensionsList?.forEach((dim: any) => {
        const dimCode = this.NewZone['U_Dimen' + dim.level];
        const dimValue = dim.values.find((v: any) => v.ocrCode === dimCode);
        this.NewZone['U_Dimen' + dim.level + '_Name'] = dimValue ? dimValue.ocrName : null;
      });

      // Clone zone for saving
      const zoneData = { ...this.NewZone };

      // ----------------------------------
      //  🔥 UPDATE MODE
      // ----------------------------------
      if (this.editingZoneIndex !== null) {
        this.ZoneList[this.editingZoneIndex] = zoneData;
        this.toastr.success("Zone updated successfully");
      }
      else {
        // ----------------------------------
        //  ➕ ADD MODE
        // ----------------------------------
        this.ZoneList.push(zoneData);
        this.toastr.success("Zone added successfully");
      }

      // Reset everything
      this.editingZoneIndex = null;
      this.Zone_BL_Floor = [];
      this.NewZone = { Zone: '', U_Code: '', Name: '', ZoneFloors: [] };
      this.ZoneFloors = [];
    }

    else if (action === 'remove' && index !== undefined) {
      this.ZoneList.splice(index, 1);
    }
  }
  editZone(index: number) {
    
    const zone = this.ZoneList[index];

    // Store index for updating
    this.editingZoneIndex = index;

    // Clone zone to NewZone for editing
    this.NewZone = { ...zone };

    // Pre-select floors
    this.Zone_BL_Floor = (zone.ZoneFloors || []).map((f: any) => f.u_FlrCode);

    // Also copy ZoneFloors used internally
    this.ZoneFloors = [...(zone.ZoneFloors || [])];
  }




  // Dropdown options
  SubZoneOptions: string[] = ['P2PH1-B1-Z01-00', 'P2PH1-B1-Z02-00', 'P2PH1-B1-Z03-00'];
  CodeOptions: string[] = ['P2PH1', 'P2PH2', 'P2PH3'];

  // Model for new entry
  NewSubZone: any = {
    U_Code: '',
    Name: '',
    U_ZnCode: '',
    ZoneId: null
  };

  SubZoneList: any[] = [];
  AddRemoveSubZoneFloors(action: any, postdata: any) {
    
    if (action === 'add') {
      if (!Array.isArray(this.Sub_Zone_BL_Floor) || this.Sub_Zone_BL_Floor.length === 0) {
        this.toastr.warning("Please select at least one floor", "Warning");
        return;
      }
      this.SubZoneSecFloors = [];
      // Add each selected floor if not already in the list
      this.Sub_Zone_BL_Floor.forEach((floorCode: any) => {
        
        const floorObj = this.FloorsList.find((f: any) => f.code === floorCode);
        if (!floorObj) return;
        const exists = this.SubZoneSecFloors.some((m: any) => m.U_FlrCode === floorObj.code);
        if (!exists) {
          this.SubZoneSecFloors.push({ U_FlrCode: floorObj.code, Name: floorObj.name });
        }
      });
      
      // Optionally clear selection after adding
      this.Sub_Zone_BL_Floor = [];
    } else {
      this.SubZoneSecFloors = this.SubZoneSecFloors.filter((item: any) => item !== postdata);
    }

  }

  AddRemoveSubZoneOld(action: string, index?: number) {
    
    if (action === 'add') {
      if (!this.NewSubZone.U_Code || !this.NewSubZone.Name) {
        this.toastr.warning("Please fill in all required fields", "Warning");
        return;
      }

      const zone = this.PostedZoneList.find((m: any) => m.id == this.NewSubZone.ZoneId);
      this.NewSubZone.U_ZnCode = zone?.u_Code || null;

      // Add selected floors
      this.AddRemoveSubZoneFloors('add', '');
      this.NewSubZone.SubZoneSecFloors = this.SubZoneSecFloors;

      // 🔹 Map dimensions (code + name)
      this.DimensionsList.forEach((dim: any) => {
        const dimCode = this.NewSubZone['U_Dimen' + dim.level];
        const dimValue = dim.values.find((v: any) => v.ocrCode === dimCode);
        this.NewSubZone['U_Dimen' + dim.level + '_Name'] = dimValue ? dimValue.ocrName : null;
      });

      // 🔹 Push to list
      const subZoneData = { ...this.NewSubZone };
      this.SubZoneList.push(subZoneData);

      // 🔹 Reset form
      this.Sub_Zone_BL_Floor = [];
      this.NewSubZone = { SubZone: '', U_Code: '', Name: '', SubZoneSecFloors: [] };
    }
    else if (action === 'remove' && index !== undefined) {
      this.SubZoneList.splice(index, 1);
    }
  }
  editingSubZoneIndex: number | null = null;
  AddRemoveSubZone(action: string, index?: number) {
    

    if (action === 'add') {

      if (!this.NewSubZone.U_Code || !this.NewSubZone.Name) {
        this.toastr.warning("Please fill in all required fields", "Warning");
        return;
      }

      // Get Zone code
      const zone = this.PostedZoneList.find((m: any) => m.id == this.NewSubZone.ZoneId);
      this.NewSubZone.U_ZnCode = zone?.u_Code || null;

      // Add floors
      this.AddRemoveSubZoneFloors('add', '');
      this.NewSubZone.SubZoneSecFloors = this.SubZoneSecFloors;

      // Map dimension names
      this.DimensionsList?.forEach((dim: any) => {
        const dimCode = this.NewSubZone['U_Dimen' + dim.level];
        const dimValue = dim.values.find((v: any) => v.ocrCode === dimCode);
        this.NewSubZone['U_Dimen' + dim.level + '_Name'] = dimValue ? dimValue.ocrName : null;
      });

      // Prepare final object
      const subZoneData = { ...this.NewSubZone };

      // -----------------------------------
      // 🔥 UPDATE MODE
      // -----------------------------------
      if (this.editingSubZoneIndex !== null) {
        this.SubZoneList[this.editingSubZoneIndex] = subZoneData;
        this.toastr.success("Sub Zone updated successfully");
      }

      // -----------------------------------
      // ➕ ADD MODE
      // -----------------------------------
      else {
        this.SubZoneList.push(subZoneData);
        this.toastr.success("Sub Zone added successfully");
      }

      // Reset everything
      this.editingSubZoneIndex = null;
      this.Sub_Zone_BL_Floor = [];
      this.NewSubZone = { SubZone: '', U_Code: '', Name: '', SubZoneSecFloors: [] };
      this.SubZoneSecFloors = [];
    }

    else if (action === 'remove' && index !== undefined) {
      this.SubZoneList.splice(index, 1);
    }
  }

  editSubZone(index: number) {
    
    const subZone = this.SubZoneList[index];

    // Store index so AddRemoveSubZone knows it is UPDATE mode
    this.editingSubZoneIndex = index;

    // Clone the selected subzone into the working object
    this.NewSubZone = { ...subZone };

    // Pre-select floors in UI
    this.Sub_Zone_BL_Floor = (subZone.SubZoneSecFloors || []).map((f: any) => f.u_FlrCode);

    // Copy internal floor structure to allow add/remove floor operations
    this.SubZoneSecFloors = [...(subZone.SubZoneSecFloors || [])];
    this.onDropDownChange(subZone.ZoneId, 'SubZone_Zone')
  }

  GetMasterData() {
    let url = '/MasterData/GetMasterData?type=Floor';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.FloorsList = result.data;
          if (history.state && history.state.DataForUpdate) {
            this.loadProjectForEdit(history.state.DataForUpdate.data);
          }
        }
      },
      error: (err: any) => { },
    });
  }
  GetMasterDimensions() {
    let url = '/MasterData/GetDimensions';
    this._service.Get(url).subscribe({
      next: result => {
        if (result.status) {
          this.DimensionsList = result.data;
        } else {
          this.toastr.error(result.message, "Error")
        }
      },
      error: (err: any) => { },
    });
  }
  editingBuildingIndex: number | null = null;
  AddRemoveBuildingsOld(action: string, index?: number) {
    

    if (action === 'add') {
      this.BLsubmitted = true;

      if (this.buildingForm.invalid) {
        return; // Stop if form is invalid
      }

      // Ensure floors are added
      this.AddRemoveBuildingFloors('add', '');
      if (this.BuildingFloorList.length === 0) {
        this.toastr.warning('Warning', 'Please fill all detail of building');
        return;
      }

      const projId = this.buildingForm.value.ProjectId;
      const codeValue = this.buildingForm.controls['U_PrjCode'].value;

      // 🧩 Build object from form
      let buildingData: any = {
        ...this.buildingForm.value,
        BuildingFloors: this.BuildingFloorList,
        BuildingPropertyDetails: this.PlotList
      };

      // 🧩 Add dimension names alongside codes (U_Dimen1Name, etc.)
      if (this.DimensionsList && this.DimensionsList.length > 0) {
        this.DimensionsList.forEach((dim: any) => {
          const dimControlName = 'U_Dimen' + dim.level;
          const dimValue = this.buildingForm.get(dimControlName)?.value;

          if (dimValue) {
            const selectedObj = dim.values.find((v: any) => v.ocrCode === dimValue);
            buildingData[`${dimControlName}Name`] = selectedObj
              ? selectedObj.ocrName
              : '';
            buildingData[`${dimControlName}Desc`] = dim.dimDesc; // optional (label)
          } else {
            buildingData[`${dimControlName}Name`] = '';
            buildingData[`${dimControlName}Desc`] = dim.dimDesc; // optional
          }
        });
      }

      // ✅ Add to list
      this.PostedBuildingList.push(buildingData);
      // Reset form and lists
      this.buildingForm.reset();
      this.BuildingFloorList = [];
      this.PlotList = [];
      this.BLsubmitted = false;

      // Refill base values
      this.buildingForm.patchValue({
        CreatedDate: new Date(),
        UpdatedDate: new Date(),
        CreatedBy: parseInt(this.CurrentUserInfo.Id),
        UpdatedBy: parseInt(this.CurrentUserInfo.Id),
        Id: 0,
        U_PrjCode: codeValue,
        ProjectId: projId
      });

    } else if (action === 'remove' && index !== undefined) {
      this.PostedBuildingList.splice(index, 1);
    }
  }
  editBuildingOld(index: number) {
    const building = this.PostedBuildingList[index];
    this.editingBuildingIndex = index;

    // Fill form
    this.buildingForm.patchValue(building);

    // Set floors and plots
    this.BuildingFloorList = [...building.BuildingFloors];
    this.PlotList = [...building.BuildingPropertyDetails];

    // (Optional) Patch created/updated fields
    this.buildingForm.patchValue({
      UpdatedBy: parseInt(this.CurrentUserInfo.Id),
      UpdatedDate: new Date()
    });
  }
  editBuilding(index: number) {
    const building = this.PostedBuildingList[index];

    this.editingBuildingIndex = index;

    // Patch form (excluding nested lists)
    this.buildingForm.patchValue({
      ...building,
      UpdatedBy: parseInt(this.CurrentUserInfo.Id),
      UpdatedDate: new Date()
    });

    this.BL_Floor = (building.BuildingFloors || []).map((f: any) => f.U_FlrCode);

    this.BuildingFloorList = [...(building.BuildingFloors || [])];

    this.PlotList = [...(building.BuildingPropertyDetails || [])];

  }

  AddRemoveBuildings(action: string, index?: number) {
    

    if (action === 'add') {

      this.BLsubmitted = true;
      if (this.buildingForm.invalid) return;

      // Ensure floors are added
      this.AddRemoveBuildingFloors('add', '');
      if (this.BuildingFloorList.length === 0) {
        this.toastr.warning('Please add atleast one floor in building', 'Warning');
        return;
      }

      const projId = this.buildingForm.value.ProjectId;
      const codeValue = this.buildingForm.controls['U_PrjCode'].value;

      let buildingData: any = {
        ...this.buildingForm.value,
        BuildingFloors: this.BuildingFloorList,
        BuildingPropertyDetails: this.PlotList
      };

      // Add dimension names
      if (this.DimensionsList?.length > 0) {
        this.DimensionsList.forEach((dim: any) => {
          const dimControlName = 'U_Dimen' + dim.level;
          const dimValue = this.buildingForm.get(dimControlName)?.value;

          const selectedObj = dim.values.find((v: any) => v.ocrCode === dimValue);
          buildingData[`${dimControlName}Name`] = selectedObj ? selectedObj.ocrName : '';
          buildingData[`${dimControlName}Desc`] = dim.dimDesc;
        });
      }

      // ✅ ADD OR UPDATE MODE
      if (this.editingBuildingIndex !== null) {
        // ------------ UPDATE EXISTING RECORD -------------
        this.PostedBuildingList[this.editingBuildingIndex] = buildingData;
        this.toastr.success('Building updated successfully');
      } else {
        // ---------------- ADD NEW RECORD ----------------
        this.PostedBuildingList.push(buildingData);
        this.toastr.success('Building added successfully', 'Success');
      }

      // Reset everything
      this.editingBuildingIndex = null;
      this.buildingForm.reset();
      this.BuildingFloorList = [];
      this.PlotList = [];
      this.BLsubmitted = false;

      // Refill base values
      this.buildingForm.patchValue({
        CreatedDate: new Date(),
        UpdatedDate: new Date(),
        CreatedBy: +this.CurrentUserInfo.Id,
        UpdatedBy: +this.CurrentUserInfo.Id,
        Id: 0,
        U_PrjCode: codeValue,
        ProjectId: projId
      });

    }
    // REMOVE
    else if (action === 'remove' && index !== undefined) {
      this.PostedBuildingList.splice(index, 1);
    }
  }


  ShowBuildingDetail(data: any) {
    
    this.selectedBuildingForDeteal = data;
    ($('#buildingDetailModal') as any).modal('show');
  }
  keysToPascalCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => keysToPascalCase(item));
    } else if (obj !== null && typeof obj === 'object') {
      const newObj: any = {};
      Object.keys(obj).forEach(key => {
        const newKey = key.charAt(0).toUpperCase() + key.slice(1);
        newObj[newKey] = keysToPascalCase(obj[key]);
      });
      return newObj;
    }
    return obj; // primitive value
  }
  onDropDownChange(data: any, form: any) {
    
    if (form == 'ZoneBuilding') {
      
      let exist = this.PostedBuildingsInDBList.find((m: any) => m.id == data);
      if (exist) {
        this.SelectedBuildingFloors = exist.buildingFloors;
      }
    }
    if (form === 'SubZone_Zone') {
      
      let exist = this.PostedZoneList.find((m: any) => m.id == data);
      if (exist) {
        
        this.SelectedZoneFloors = exist.zoneFloors;
      }
    }
  }
  loadProjectForEdit(project: any) {
    
    // 1️⃣ Fill Project form
    this.projectForm.patchValue({
      Id: project.id,
      Name: project.name,
      U_Code: project.u_Code,
      CreatedDate: project.createdDate || new Date(),
      UpdatedDate: project.updatedDate || new Date(),
      CreatedBy: project.createdBy,
      UpdatedBy: project.updatedBy
    });

    // 2️⃣ Map Buildings
    this.PostedBuildingList = [];
    this.PostedBuildingsInDBList = project.buildings || [];

    (project.buildings || []).forEach((bld: any) => {
      const buildingData = {
        Id: bld.id,
        Name: bld.name,
        U_Code: bld.u_Code,
        U_PrjCode: project.u_Code,
        ProjectId: project.id,
        CreatedBy: bld.createdBy || this.CurrentUserInfo.Id,
        UpdatedBy: bld.updatedBy || this.CurrentUserInfo.Id,
        // BuildingFloors: bld.buildingFloors || [],
        BuildingFloors: (bld.buildingFloors || []).map((floor: any) => ({
          ...floor,
          U_FlrCode: floor.u_FlrCode,   // copy value
          Name: floor.name
        })),
        // BuildingPropertyDetails: bld.buildingPropertyDetails || [],

        BuildingPropertyDetails: (bld.buildingPropertyDetails || []).map((floor: any) => ({
          ...floor,
          U_PNo: floor.u_PNo,
          U_PSize: floor.u_PSize,
          U_POwner: floor.u_POwner,
          U_Deed: floor.u_Deed,
          U_PStatus: floor.u_PStatus,
          U_AQSDate: floor.u_AQSDate,
          U_AQEDate: floor.u_AQEDate,
        })),
        U_Dimen1: bld.u_Dimen1,
        U_Dimen2: bld.u_Dimen2,
        U_Dimen3: bld.u_Dimen3,
        U_Dimen4: bld.u_Dimen4,
        U_Dimen5: bld.u_Dimen5,
      };
      
      this.PostedBuildingList.push(buildingData);
    });

    // 3️⃣ Map Zones
    this.ZoneList = [];
    this.PostedZoneList = [];
    (project.buildings || []).forEach((b: any) => {
      (b.zones || []).forEach((z: any) => {
        
        this.onDropDownChange(b.id, 'ZoneBuilding')
        const zoneData = {
          Id: z.id,
          Name: z.name,
          U_Code: z.u_Code,
          U_BldCode: b.u_Code,
          BuildingId: b.id,
          //ZoneFloors: z.zoneFloors || [],

          ZoneFloors: (z.zoneFloors || []).map((f: any) => ({
            ...f,
            Name: f.name
          })),

          U_Dimen1: z.u_Dimen1,
          U_Dimen2: z.u_Dimen2,
          U_Dimen3: z.u_Dimen3,
          U_Dimen4: z.u_Dimen4,
          U_Dimen5: z.u_Dimen5,
        };
        this.ZoneList.push(zoneData);
        this.PostedZoneList.push(zoneData);
      });
    });
    
    // 4️⃣ Map SubZones
    this.SubZoneList = [];
    (project.buildings || []).forEach((b: any) => {
      
      (b.zones || []).forEach((z: any) => {
        
        (z.subSectionofZone || []).forEach((sz: any) => {
          
          this.onDropDownChange(z.id, 'SubZone_Zone')
          const subZoneData = {
            Id: sz.id,
            Name: sz.name,
            U_Code: sz.u_Code,
            U_ZnCode: z.u_Code,
            ZoneId: z.id,
            U_Dimen1: sz.u_Dimen1,
            U_Dimen2: sz.u_Dimen2,
            U_Dimen3: sz.u_Dimen3,
            U_Dimen4: sz.u_Dimen4,
            U_Dimen5: sz.u_Dimen5,
            //SubZoneSecFloors: sz.subZoneSecFloors || []
            SubZoneSecFloors: (sz.subZoneSecFloors || []).map((f: any) => ({
              ...f,
              Name: f.name
            }))
          };

          this.SubZoneList.push(subZoneData);
        });
      });
    });

    // 5️⃣ Set project-related values for forms
    this.buildingForm.patchValue({
      U_PrjCode: project.u_Code,
      ProjectId: project.id
    });

    this.currentStep = 1; // reset wizard to step 1
    this.toastr.info("Project data loaded for editing", "Edit Mode", {
      progressBar: true,
      closeButton: true
    });
    const currentUrl = this.location.path()
    // Replace the state with a new state object
    this.location.replaceState(currentUrl, '', { data: null })
  }
  getDimensionName(level: number, code: string): string {
    if (!code) return '-';

    const dim = this.DimensionsList.find((d: any) => d.level === level);
    if (!dim || !dim.values) return '-';

    const val = dim.values.find((v: any) => v.ocrCode === code);
    return val ? val.ocrName : code; // fallback to code if name not found
  }
}