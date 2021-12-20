sap.ui.define([
    "sap/ui/base/ManagedObject",
    "sap/m/Column",
    "sap/m/ColumnListItem",
    "sap/ui/layout/form/FormContainer",
    "sap/ui/layout/form/FormElement",
    "sap/m/IconTabBar",
    "sap/ui/core/BusyIndicator",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "sap/ui/export/Spreadsheet",
    "../data/data",
    "./AyudaBusquedaEmb",
    "sap/ui/core/Fragment",
    "../model/formatter"
	// "sap/ui/unified/calendar/Header"
], function(
        ManagedObject,
        Column,
        ColumnListItem,
        FormContainer,
        FormElement,
        IconTabBar,
        BusyIndicator,
        Filter,
        FilterOperator,
        Spreadsheet,
        Data,
        AyudaBusquedaEmb,
        Fragment,
        format
    ) {
    'use strict';
    return ManagedObject.extend("com.tasa.config.controller.Fragments",{
        constructor: function(oView,sFragName) {
			this._oView = oView;
			this._oControl = sap.ui.xmlfragment(oView.getId(), "com.tasa.config.fragments."+sFragName, this);
			this._bInit = false;
		},

        formatter:format,

        // formatter:function(sFecha){
        //     return this.getController().setFormatDate(sFecha);
        // },

		exit: function() {
			delete this._oView;
		},

		getView: function() {
			return this._oView;
        },
        
        getController:function(){
            return this.getView().getController();
        },

		getControl: function() {
			return this._oControl;
		},

		getOwnerComponent: function() {
			return this._oView.getController().getOwnerComponent();
		},

		openBy: function() {
			var oView = this._oView;
			var oControl = this._oControl;

			if (!this._bInit) {
				// Initialize our fragment
				this.onInit();
				this._bInit = true;
                oView.addDependent(oControl);
			};

			// var args = Array.prototype.slice.call(arguments);
			// if (oControl.open) {
			// 	oControl.open.apply(oControl, args);
			// } else if (oControl.openBy) {
			// 	oControl.openBy.apply(oControl, args);
			// }
		},

		close: function(oEvent) {
            this._oControl.close();
		},

		setRouter: function(oRouter) {
			this.oRouter = oRouter;
		},
		getBindingParameters: function() {
			return {};
		},
		onInit: function() {
			this._oFragment = this.getControl();
		},
		onExit: function() {
			this._oFragment.destroy();
        },
        
        /**
         *  Creacion de columnas
         */
        setColumnas:function(oMaster,aFields){
            let oControl = this.getControl(), 
            oColumn,oColEdit,oText,aFieldsNew;
            aFields.forEach(oCol => {
                if(oCol.CONTROLTABLE){
                    oColumn = new Column({
                        width:oCol.ORDENMEW===1 ? "8rem":"auto",
                        demandPopin:oCol.ORDENMEW!==1,
                        minScreenWidth:oCol.ORDENMEW!==1 ? "Tablet":"",
                    })
                    oText = new sap.m.Text({text:oCol.NAMEFIELD});
                    oColumn.setHeader(oText);
                    oControl.addColumn(oColumn);
                }
            });

            aFieldsNew =  oMaster.fields.filter(oField=>oField.CONTROLNEW);
            if(aFieldsNew.length>0||oMaster["IDAPP"]==="C05"){
                this.getController().getModel("detailView").setProperty("/visibleBtnNew", true);
                oColEdit = new Column();
                oColEdit.setHeader(new sap.m.Text({text:"Editar"}));
                oControl.addColumn(oColEdit);
            }
        },

        unsetColumns:function(){
            let oControl=this._oControl;
            oControl.removeAllColumns();
        },
        
        /**
         * Creacion de items
         */
        
         setItems:function(oMaster){
             let oControl=this.getControl(),
             that = this,
             oService = oMaster.services.find(serv=>serv.IDSERVICE==="TABLE"),
             aCells=[];
            oMaster.fields.forEach((oItem)=>{
                if(oItem.BINDTABLE){
                    if(oItem.CONTROLTABLE==="TEXT"&&oItem.ORDENMEW!==1){
                        if(oItem.IDFIELD==="ESIMP"){
                            let sPath = oItem.BINDTABLE;
                            sPath = sPath.split("{")[1].split("}")[0];
                            aCells.push(new sap.m.Text({
                                text:`{
                                    path:'${sPath}'
                                }`
                            }));

                        }else{
                            aCells.push(new sap.m.Text({
                                text:oItem.BINDTABLE
                            }));

                        }
                    }else if(oItem.CONTROLTABLE==="INPUT"){
                        aCells.push(new sap.m.Input({
                            value:oItem.BINDTABLE,
                            change:function(oEvent){
                                let sValue = oEvent.getParameter("value"),
                                oContext = oEvent.getSource().getBindingContext("DatosMaestro"),
                                oContextMaster = oEvent.getSource().getBindingContext(),
                                oItem = oContext.getObject(),
                                oMaster=oContextMaster.getObject(),
                                sCodigo;
                                oMaster.fields.forEach(oField=>{
                                    if(oField.readOnly){
                                        sCodigo=oItem[oField.idField];
                                    }
                                });
                                let oService=oMaster.services.find(serv=>serv.IDSERVICE==="update");
                                oService.param.data=`|${sValue}|${sCodigo}|S`;
                                that.getController().oModelMaestro.setProperty("/oSave",oService);
                            }
                        }));
                    }else if(oItem.ORDENMEW===1){
                        aCells.push(new sap.m.ObjectStatus({
                            text:oItem.BINDTABLE,
                            state:"Indication06"
                        }));
                    } 
                }
            });
            let aFields =  oMaster.fields.filter(oField=>oField.CONTROLNEW);
            if(aFields.length>0||oMaster["IDAPP"]==="C05"){
                aCells.push(new sap.m.Button({
                    text:"editar",
                    press:function(oEvent){
                        if(oMaster["IDAPP"]==="C05"){
                            this.openEditImpreVale(oEvent);
                        }else{
                            this.onNuevoMaestro(oEvent);
                        }
                    }.bind(this)
                }));

            }
            // aCells.forEach((oCell)=>{
            //      oCell.bindText('DatosMaestro>Planta')
            // });
            let oColumnList = new ColumnListItem({
                cells:aCells,
                type:"Active",
                press:function(oEvent){
                    // set property navigation
                    this.onNuevoMaestro(oEvent);
                }.bind(this)
            });
            // oColumnList.setNavigated();
            oControl.bindItems(oService.MODEL+">"+oService.PROPERTY,oColumnList);
         },

        isNavigated:function(sNavigatedItemId, sItemId){
			return sNavigatedItemId === sItemId;
		},

         unsetItemsTable:function(){
             let oControl=this._oControl;
             oControl.unbindAggregation("items",true);
         },
        
        /**
         * Creacion de campos de busqueda simple
         * @param {array} arrayCampos 
         */

         /**
          * Creacion de controles para busqueda simple
          * @param {*} arrayCampos 
          */
        buildForm:function(oMaster,aFields,param){
            let oControl=this.getControl(),
            oService = oMaster.services.find(serv=>serv.INITSERVICE==="TRUE"),
            oModel = this.getController().getModel(oService.MODEL),
            oFormContainer = new FormContainer(),
            oFormContainerButton= new FormContainer,
            oFormElement,control,
            oButtonSearch,oButtonClean;

            aFields = oMaster.fields.filter(oField=>oField.CONTROLSEARCH);
            if(param==="M13"){
                aFields = aFields.filter(oField=>oField.KEYTAB==="T00"||oField.ORDENMEW<5);
            }
            if(param==="A"){
                aFields=aFields.filter(oField=>oField.ORDENMEW>4&&oField.KEYPANEL);
            }
            aFields.forEach(oCampo=>{
               oFormElement = new FormElement({label:oCampo.NAMEFIELD});

               control=this.getController().mFields[oCampo.IDFIELD+"0"];
               if(!control){
                   if (oCampo.CONTROLSEARCH==="INPUT/NUMERIC"||oCampo.CONTROLSEARCH==="INPUT"){
                       control=this.buildControlInput(control,oCampo,oMaster,"0");
                   }else if(oCampo.CONTROLSEARCH==="COMBOBOX"){
                       control = this.buildControlCombo(control,oCampo,oService,oModel,"0");
                   }else{
                       control = this.buildDate(control,oCampo)
                   }
                   this.getController().mFields[oCampo.IDFIELD+"0"] = control;
               }
               oFormElement.addField(control);
               // si el input es un rango
               if(oCampo.RANGE==="TRUE"){
                   control=this.getController().mFields[oCampo.IDFIELD+"1"];
                   if(!control){
                       if(oCampo.CONTROLSEARCH==="INPUT/NUMERIC"||oCampo.CONTROLSEARCH==="INPUT"){
                           control= this.buildControlInput(control,oCampo,oMaster,"1");
                       }else if(oCampo.CONTROLSEARCH==="COMBOBOX"){
                           control = this.buildControlCombo(control,oCampo,oService,oModel,"1");
                       }
                       this.getController().mFields[oCampo.IDFIELD+"1"]=control;
                   }
                   oFormElement.addField(control);
               }
               oFormContainer.addFormElement(oFormElement);
            });
            
            oControl.addFormContainer(oFormContainer);

            if(aFields.length>0&&!param||param==="M13"){
               oButtonSearch = new sap.m.Button({
                   text:"Buscar",
                   type:"Emphasized",
                   icon:"sap-icon://search",
                   press:function(oEvent){
                       BusyIndicator.show(0);
                       this.onBusquedaSimple(oEvent);
                   }.bind(this)
               });
               oButtonClean = new sap.m.Button({
                   text:"Limpiar filtros",
                   type:"Ghost",
                   icon:"sap-icon://clear-filter",
                   press:function(oEvent){
                       BusyIndicator.show(0);
                       this.onCleanSearch(oEvent);
                   }.bind(this)
               });
               let oFormElementButtom = new FormElement({
                  label:""
               });
               oFormElementButtom.addField(oButtonSearch);
               oFormElementButtom.addField(oButtonClean);
               oFormContainerButton.addFormElement(oFormElementButtom);
               oControl.addFormContainer(oFormContainerButton)
           }
        },

        buildControlInput:function(control,oCampo,oMaster,sId){
            control = new sap.m.Input(oCampo.IDFIELD+sId,{
                value:"",
                maxLength:oCampo.LENGTH,
                required:oCampo.REQUIRED==="TRUE",
                showTableSuggestionValueHelp:false,
                placeholder:"Ingrese "+ oCampo.NAMEFIELD,
                type:oCampo.CONTROLSEARCH.split("/")[1]==="NUMERIC"?"Number":"Text",
                // showValueHelp:oCampo.COMPONENT==="B03",
                valueHelpRequest:function(oEvent){
                    this.showSearchHelp(oEvent);
                }.bind(this)
            });
            control.setShowValueHelp(false)
            if(oCampo.COMPONENT){
                this.buildSuggestion(control,oCampo,oMaster);
                if(oCampo.COMPONENT==="B03")
                    control.setShowValueHelp(true)
            }
            if(oCampo.IDFIELD==="ROWCOUNT")
                control.setValue(100);
            return control;
        },

        buildControlCombo:function(control,oCampo,oService,oModel,sId){
            let sKey,
            sText,
            sPath,
            oItemTemplate;

            sKey = `{${oService.MODEL}>id}`;
            sText = `{${oService.MODEL}>descripcion}`;
            sPath = oService.MODEL+">/"+oCampo.IDFIELD;
            oItemTemplate = new sap.ui.core.ListItem({
                key:sKey,
                text:sText
            });
            control = new sap.m.ComboBox(oCampo.IDFIELD+sId,{
                items: {
                    path: sPath,
                    template: oItemTemplate,
                    templateShareable: false
                },
                placeholder:"Seleccione "+oCampo.NAMEFIELD,
                // selectedKey:`${oService.MODEL}>/${oCampo.IDFIELD}`
                // selectionChange:function(oEvent){
                //     let skey = oEvent.getParameter("selectedItem").getKey();
                //     oModel.setProperty(`/${oCampo.IDFIELD}`,skey);
                // }.bind(this)
            });
            return control;
        },

        buildSuggestion:function(control,oCampo,oMaster){
            // const app = Data.find(item=>item.idApp==="B01");
            const oModelHelp = this.getController().getModel("AYUDABUSQUEDA"); 
            let aCells=[],
            oCol,
            aDataHelp = oModelHelp.getProperty(`/${oCampo.COMPONENT}`),
            aFieldsName = oModelHelp.getProperty(`/name${oCampo.COMPONENT}`),
            aColumns;

            if(aDataHelp){
                aFieldsName.forEach(campo=>{
                    oCol = new sap.m.Column
                    if(oCol.ORDENMEW!==1){
                        oCol.setDemandPopin(true);
                        oCol.setPopinDisplay("Inline");
                        oCol.setMinScreenWidth("Large");
                    }
                    oCol.setWidth("8rem");
                    oCol.setHeader(new sap.m.Label({text:campo.NAMEFIELD}))
                    control.addSuggestionColumn(oCol);
                    if(campo.CONTROLTABLE==="TEXT"&&campo.ORDENMEW===1){
                        aCells.push(new sap.m.ObjectStatus({
                            text:`{AYUDABUSQUEDA>${campo.IDFIELD}}`,
                            state:"Indication06"
                        }))
                    }else{
                        aCells.push(new sap.m.Text({text:`{AYUDABUSQUEDA>${campo.IDFIELD}}`}))
                    }
                });
    
                const oTemplate = new sap.m.ColumnListItem({
                    cells:aCells
                })
                // const oService = app.services.find(serv=>serv.IDSERVICE==="Table")
                control.bindSuggestionRows("AYUDABUSQUEDA>/"+oCampo.COMPONENT,oTemplate)
                control.setShowSuggestion(true);
                control.setValueState("Information");
                control.setValueStateText("Selecione "+oCampo.NAMEFIELD);
            }
        },

        buildDate:function(control,oCampo,oMaster,sId){
            
            if(oCampo.RANGE==="TRUE"){
                control = new sap.m.DateRangeSelection(oCampo.IDFIELD+sId,{
                    displayFormat:"dd/MM/yyyy"
                });
            }else{
                control = new sap.m.DatePicker(oCampo.IDFIELD+sId,{
                    displayFormat:"dd/MM/yyyy"
                });
            }
            return control;
        },

        showSearchHelp:function(oEvent){
            // this.getController().crearFragments("AyudaBusquedaEmb");
            let oModelMaster = this.getController().getModel("DATOSMAESTRO"),
            sIdControl = oEvent.getParameter("id");
            oModelMaster.setProperty("/searchEmbar",{});
            oModelMaster.setProperty("/idControl",sIdControl);
            let oDialog = new AyudaBusquedaEmb(this.getView());
            oDialog.open();
        },

        buildTable:function(oMaster,aFields){
            this.setColumnas(oMaster,aFields);
            this.setItems(oMaster)
        },

        /**
         * Creacion de Formulario nuevo y editar
         * @param {*} arrayCampos 
         */
        setCamposNuevo:function(oMaster,param){
            let oControl=this._oControl,
            oServiceInit = oMaster.services.find(serv=>serv.INITSERVICE==="TRUE"),
            oServiceTable = oMaster.services.find(serv=>serv.IDSERVICE==="TABLE"),
            oFormContainer = new FormContainer(),
            oFormElement={},
            oItemTemplate,
            control,
            sBindEdit,
            aFields =  oMaster.fields.filter(oField=>oField.CONTROLNEW);
            // oDataEdit = this.getController().oModelMaestro.getProperty("/editar");
             if(param)
                aFields =  oMaster.fields.filter(oField=>oField.keyTab===param);
            
            aFields.forEach(oCampo=>{
                if(oCampo.CONTROLNEW){
                    oFormElement = new FormElement({
                        label:new sap.m.Label({text:oCampo.NAMEFIELD}),
                        fields:[]
                    });
                    sBindEdit=`${oServiceTable.MODEL}>/${oCampo.IDFIELD}N`
                    control = this.getController().mFields[oCampo.IDFIELD+"N"];
                    if(!control){
                        if (oCampo.CONTROLNEW==="INPUT"){
                            control = new sap.m.Input(oCampo.IDFIELD+"N",{
                                // value:oDataEdit?oDataEdit[oCampo.IDFIELD]:"",
                                value:`{${sBindEdit}}`,
                                placeholder:"Ingrese "+ oCampo.NAMEFIELD,
                                editable:oCampo.READONLY==="TRUE"?false:true,
                                showValueHelp:oCampo.COMPONENT?true:false,
                                valueHelpRequest:function(){
                                    this.onSearchComponent(oMaster,oCampo,oCampo.IDFIELD+"N");   
                                }.bind(this)
                            })
                        }else if(oCampo.CONTROLNEW==="COMBOBOX"){
                            oItemTemplate = new sap.ui.core.ListItem({
                                key:`{${oServiceInit.MODEL}>id}`,
                                text:`{${oServiceInit.MODEL}>descripcion}`
                            });
                            control = new sap.m.ComboBox(oCampo.IDFIELD+"N",{
                                placeholder:"Ingrese "+ oCampo.NAMEFIELD,
                                selectedKey:sBindEdit,
                                items: {
                                    path: `${oServiceInit.MODEL}>${oServiceInit.PROPERTY}/0/data`,
                                    template: oItemTemplate,
                                    templateShareable: false
                                }
                            })
                        }else if(oCampo.CONTROLNEW==="FECHA"){
                            control = new sap.m.DatePicker(oCampo.IDFIELD+"N",{
                                
                            })
                        }else{
                            control = new sap.m.Button(oCampo.IDFIELD+"N",{
                                text:"Guardar",
                                type:"Emphasized",
                                press:function(oEvent){
                                    BusyIndicator.show(0);
                                    // this.setItems(arrayCampos)
                                    this.onBusquedaSimple(oEvent);
                                }.bind(this)
                            });
                        }
                        this.getController().mFields[oCampo.IDFIELD+"N"]=control;
                    };
                    control.bindProperty("value",sBindEdit);
                    oFormElement.addField(control);
                    
                    oFormContainer.addFormElement(oFormElement);
                }

            });
            oControl.addFormContainer(oFormContainer);
        },

        openEditImpreVale:function(oEvent){
            let oContext = oEvent.getSource().getBindingContext("DATOSMAESTRO"),
            oModelMaster = this.getController().getModel("DATOSMAESTRO"),
            sPath = oContext.getPath(),
            oVale = oContext.getObject();

            oModelMaster.setProperty("/titleDialog",oVale.NRVVI);

            let oService = {
                PATH: "/api/valeviveres/DetalleImpresionViveres",
                MODEL: "DATOSMAESTRO",
                param:{
                    fields: [],
                    p_code: oVale.NRVVI,
                    p_user: "FGARCIA"
                }
            }
            this.getController().getDetalleImprValeViveres(oService);
            
            let oFragmentP = this.getController().mFragments["imprValeViv"];
            if(!oFragmentP){
                oFragmentP = Fragment.load({
                    name:"com.tasa.config.fragments.impresionValeViveres.edit",
                    controller:this
                }).then(oDialog=>{
                    this.getView().addDependent(oDialog);
                    return oDialog;  
                })
                this.getController().mFragments["imprValeViv"]=oFragmentP;
            }
            oFragmentP.then(oDialog=>{
                // oModelMaster.setProperty("/detalle",oVale)
                oDialog.bindElement({
                    path:sPath,
                    model:"DATOSMAESTRO"
                })
                oDialog.open()
            })
        },

        onGuardarImpreValViv:function(oEvent){
            let oElementBinding = oEvent.getSource().getParent().getElementBinding("DATOSMAESTRO"),
            sPath = oElementBinding.getPath(),
            oModelMaster = oElementBinding.getModel(),
            oContext = oEvent.getSource().getBindingContext(),
            oMaster = oContext.getObject(),
            oDetalle = oElementBinding.getModel().getProperty(sPath),
            sNumVale = oDetalle["NRVVI"],
            sStatusImpr = oDetalle["ESIMP"];
            let oService={
                param:{
                    p_user: "FGARCIA",
                    str_set: [
                      {
                        cmopt: `NRVVI = '${sNumVale}'`,
                        cmset: `ESIMP = '${sStatusImpr}'`,
                        nmtab: "ZFLVVI"
                      }
                    ]
                },
                PATH:"/api/General/Update_Camp_Table/",
                MODEL:"DATOSMAESTRO"
              }

            this.getController()._updateService(oService,oMaster);
            this.onCloseDialog(oEvent)
        },

        onCloseDialog:function(oEvent){
            let oDialog = oEvent.getSource().getParent();
            oDialog.close();
        },

        /**
         * Contenido para Embarcacion: Tab General
         */

         /**
          * 
          * @param {aItemsTabBar} aItemsTabBar 
          */
        setIconTabBar:function(aItemsTabBar){
            let oControl=this._oControl, 
            oIconTabBar = new IconTabBar({
                select:function(oEvent){
                    this.onFilterSelect(oEvent);
                }.bind(this)
            }),
            oItemTab;
            aItemsTabBar.forEach((oItem=>{
                oItemTab=new sap.m.IconTabFilter({
                    key : oItem.key,
                    text : oItem.text,
                    icon : oItem.icon,
                    iconColor : oItem.iconColor
                })
                oIconTabBar.addItem(oItemTab);
                oIconTabBar.addContent();
            }));
            oControl.addContent(oIconTabBar);
        },

         /**
          * Eventos para tabla
          * @param {*} oEvent 
          */

         onNuevoMaestro:function(oEvent){
             let oContext = this.getControl().getBindingContext(),
             oContextData = oEvent.getSource().getBindingContext("DATOSMAESTRO"),
             oDataMaster=oContextData.getObject(),
             oMaster = oContext.getObject();
             oMaster.fields.forEach(oField=>{
                if(oField.CONTROLNEW){
                    if(!oDataMaster){
                        this.getController().oModelMaestro.setProperty(`/${oField.IDFIELD}N`,"")
                    }else{
                        this.getController().oModelMaestro.setProperty(`/${oField.IDFIELD}N`,oDataMaster[oField.IDFIELD])
                    }
                }
            });
            if(oMaster["IDAPP"]==="C05"){
                this.openEditImpreVale(oEvent);
            }else{

                this.getController().crearFormNuevo(oMaster,oDataMaster);
            }

        },
        
        onSaveNew:function(oEvent){
            BusyIndicator.show(0);
            let oMaster = oEvent.getSource().getBindingContext().getObject(),
            serv = oMaster.services.find(oServ=>oServ.IDSERVICE==="TABLE"),
            sFieldWhere,
            sValue,
            sKeyWhere,
            oOption={},
            aOption=[],
            oService = {
                PATH:"/api/General/Update_Table2/",
                param: {}
            };
            oMaster.fields.forEach(oField=>{
                sValue = this.getController().oModelMaestro.getProperty(`/${oField.IDFIELD}N`);
                if(oField.ORDENMEW===1){
                    sFieldWhere = oField.IDFIELD
                    sKeyWhere = sValue
                }
                if(oField.CONTROLNEW&&oField.READONLY==="FALSE"){
                    oOption={
                        field:oField.IDFIELD,
                        valor:sValue
                    }
                    aOption.push(oOption); 
                }
            });
            oService.param={
                data: "",
                fieldWhere: sKeyWhere?sFieldWhere:"",
                flag: "X",
                keyWhere: sKeyWhere,
                opcion: aOption,
                p_case: "E",
                p_user: "FGARCIA",
                tabla: "ZFLALM"
            }
            this.getController()._updateService(oService,oMaster);
            this.close();
        },

        /**
         * evento para filtrado rapido de tabla
         * @param {*} oEvent 
         */
        onSearchFilter:function(oEvent){
            let oMaster = oEvent.getSource().getBindingContext().getObject(),
            aColumns = oMaster.fields.filter(oField=>oField.CONTROLTABLE),
            filter,oFilter;

            // add filter for search
			const aFilters = [];
			let sQuery = oEvent.getSource().getValue();
			if (sQuery && sQuery.length > 0) {
                aColumns.forEach(oCol=>{
                    filter = new Filter(
                        oCol.IDFIELD,
                        FilterOperator.Contains,
                        sQuery
                    );
                    aFilters.push(filter);
                })
                aFilters.push(filter);

                oFilter = new Filter({
                    filters:aFilters,
                    and:false
                })
			}

			// update list binding
			const oTable = oEvent.getSource().getParent().getParent();
			let oBinding = oTable.getBinding("items");
			oBinding.filter(oFilter, "Application");
        },

        onExportar:function(oEvent){
            let oMaster=oEvent.getSource().getBindingContext().getObject(),
            oService = oMaster.services.find(oServ=>oServ.IDSERVICE==="TABLE"),
            aFields = oMaster.fields.filter(oField=>oField.CONTROLTABLE),
            aColumns=this.createColumnsExport(aFields),
            oTable=this.getView().byId("idTable"),
            aItems = oTable.getModel("DATOSMAESTRO").getProperty(oService.PROPERTY);
            if(!aItems){
                let sMessage = "No hay datos para exportar",
                sTypeDialog="Warning"
                this.getController().getMessageDialog(sTypeDialog,sMessage);
                return;
            }
            // oRowBinding=oTable.getBinding('items'),
            let oSettings = {
				workbook: { columns: aColumns },
				dataSource: aItems,
				fileName: `${oMaster.NAMEAPP}.xlsx}`,
				worker: false 
			},
            oSheet = new Spreadsheet(oSettings);
			oSheet.build().finally(function() {
				oSheet.destroy();
			});
        },

        createColumnsExport:function(aFields){
            let aColumnsExport = aFields.map(oCol=>{
                return {
                    label:oCol.NAMEFIELD,
                    property:oCol.IDFIELD
                }
            });
            return aColumnsExport;
        },


        /**
         * Eventos para Formulario basico
         */
         onBusquedaSimple:function(oEvent){
            let oContext = this._oControl.getBindingContext(),
             oMaestro = oContext.getObject(),
             oService = oMaestro.services.find(serv=>serv.IDSERVICE==="TABLE"&&serv.INITSERVICE==="FALSE"||serv.IDSERVICE==="TABLE"),
             oModelMaster=this.getController().getModel(oService.MODEL),
             sValueLow,sValueHigh="",control;

            oService.param={};
            // oService.param.delimitador=oService.DELIMITADOR;
            oService.param.fields=[];
            // oService.param.no_data=oService.NO_DATA;
            oService.param.options1=[];
            oService.param.options2=[];
            // oService.param.order=oService.ORDER_S;
            oService.param.p_user="FGARCIA";
            oService.param.rowcount=oService.ROWCOUNT_S
            // oService.param.rowskips=oService.ROWSKIPS;
            // oService.param.tabla=oService.TABLA;
            
            // oMaestro.fields.forEach(oField=>{
            //     oService.param.fields.push(oField.IDFIELD)
            // });

            let aDataFields = oMaestro.fields.filter(oField=>oField.CONTROLSEARCH);

            aDataFields.forEach(oField=>{
                control=this.getController().mFields[oField.IDFIELD+"0"];
                if(oField.CONTROLSEARCH==="INPUT"||oField.CONTROLSEARCH==="INPUT/NUMERIC"){
                    sValueLow = control.getValue();
                }else if(oField.CONTROLSEARCH==="COMBOBOX"){
                    // harcod
                    // if(oField.IDFIELD==="TEMPO") oField.IDFIELD = "CDTPO";
                    // if(oField.IDFIELD==="TEMPO") oField.IDFIELD = "CDTPO";
                    sValueLow=control.getSelectedKey();
                }else if(oField.CONTROLSEARCH==="DATE"){
                    if(control.getValue()){
                        if(oField.CONTROLSEARCH==="DATE"){
                            let range = control.getValue(),
                            valueLow = range.split(" - ")[0],
                            valueHigh = range.split(" - ")[1];

                            valueLow = valueLow.split("/")[1]+"/"+valueLow.split("/")[0]+"/"+valueLow.split("/")[2];
                            valueHigh = valueHigh.split("/")[1]+"/"+valueHigh.split("/")[0]+"/"+valueHigh.split("/")[2];
                            valueLow = new Date(valueLow);
                            valueHigh = new Date(valueHigh);
                            sValueLow = this.getController().paramDate(valueLow);
                            sValueHigh = this.getController().paramDate(valueHigh);
                        }else{
                            let sValue = control.getValue();
                            sValue = sValue.split("/")[1]+"/"+sValue.split("/")[0]+"/"+sValue.split("/")[2]
                            let oDate = new Date(sValue);
                            sValueLow = this.getController().paramDate(oDate) ;
                        }
                    }else{
                        sValueLow = "";
                    }
                }
                if(oField.RANGE==="TRUE"&&oField.CONTROLSEARCH!=="DATE"){
                    control=this.getController().mFields[oField.IDFIELD+"1"];
                    if(control) sValueHigh = control.getValue();
                }
                if(sValueLow!==""||sValueHigh!==""){
                    if(oField.IDFIELD==="ROWCOUNT"){
                        oService.param.rowcount=sValueLow
                    }else{
                        let oControl = oField.CONTROLSEARCH;
                        if(oField.RANGE==="TRUE")
                            oControl="MULTIINPUT";
                        oService.param.options2.push(
                            {
                                key:oField.IDFIELD,
                                valueLow:sValueLow,
                                valueHigh:sValueHigh,
                                control:oControl,
                                cantidad:oField.LENGTH
                            }
                        )
                        
                    }
                }

                sValueLow = "";
                sValueHigh = "";
            });
            this.getController()._getReadTable(oService,oMaestro);
            oModelMaster.setProperty("/serviceBusqueda",oService);
           // this.getView().getController()._getReadtable();
           // oService.param.options=[]
         },

         onCleanSearch:function(oEvent){
            this.getController().cleanForm(oEvent);
        },

        onSearchComponent:function(oMaster,oCampo,sIdField){
            let oComponent=Data.find(oElement=>oElement.idApp===oCampo.COMPONENT),
            oService = oComponent.services.find(oServ=>oServ.INITSERVICE==="TRUE");
            if(oService)
                this.getView().getController()._getServiceBusqueda(oService,oMaster);
            this.getView().getController()._openSearchComponent(oMaster,sIdField,oComponent);
        },

        /**
         * Eventos para Dialog
         */
        
        onFilterSelect:function(oEvent){
             let oContext = oEvent.getSource().getBindingContext("ConfigMaestros"),
             oMaestro = oContext.getObject(),
             sSelectedKey=oEvent.getParameter("selectedKey"),
             oIconTabBar=oEvent.getSource();
             oIconTabBar.removeAllContent();
             this.getController().changeFilterTab(oIconTabBar,sSelectedKey,oMaestro);
        }

    });
},/* bExport= */ true);