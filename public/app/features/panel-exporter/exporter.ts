import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';

import { locationService, setDataSourceSrv, setBackendSrv, setLocationSrv } from '@grafana/runtime';
import { GrafanaBootConfig } from '@grafana/runtime/src/config';
import { config } from 'app/core/config'
import { KeybindingSrv } from 'app/core/services/keybindingSrv';
import { AppChromeService } from 'app/core/components/AppChrome/AppChromeService'
import { NewFrontendAssetsChecker } from 'app/core/services/NewFrontendAssetsChecker';
import { DashboardSrv, setDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import { initDashboard } from 'app/features/dashboard/state/initDashboard';
import { DatasourceSrv } from 'app/features/plugins/datasource_srv';
import { DashboardDTO, DashboardRoutes } from 'app/types';
import { backendSrv } from 'app/core/services/backend_srv';
import { DashboardPanel } from 'app/features/dashboard/dashgrid/DashboardPanel';
import { DashboardModel } from 'app/features/dashboard/state/DashboardModel';
import { configureStore } from 'app/store/configureStore';
import { getDashboardAPI } from 'app/features/dashboard/api/dashboard_api';
import { GrafanaContext } from 'app/core/context/GrafanaContext';

// in this context, we'll be getting the config asynchronously.
// Normally, window.grafanaBootData is set in index.html and
// the 'config' system relies upon this synchronicity. Here,
// we'll manually instantiate it instead.
function getConfig(){

  function checkAndResolveLater(resolve:any, reject:any, timeout:any){
    if(timeout > 3000){ reject('Application did not load in time!') }
    let bootData = (window as any).grafanaBootData;
    if(!!bootData){
      const options = bootData.settings;
      options.bootData = bootData;

      const conf = new GrafanaBootConfig(options);
      resolve(conf);
    } else {
      window.setTimeout(()=>{
        checkAndResolveLater(resolve, reject, timeout + 100)
      }, timeout);
    }
  }

  return new Promise((resolve, reject)=>{
    checkAndResolveLater(resolve, reject, 100);
  })

}

interface AppContext {
  store: any,
  backend: any,
  location: any,
  config: any,
  chrome: any,
  keybindings: any,
  newAssetsChecker: any
}

const GrafContext: any = function(dashboardUid:string){
  return getConfig().then((conf: any)=>{
    if(GrafContext._appContext){
      return new Promise((resolve)=>{
        resolve(GrafContext._appContext);
      })
    }
    // monkeypatch the synchronous config. There appears to be no 'easy' way around this,
    // not sure if it will work.
    for(let key in conf){
      // @ts-ignore: typing will never work here
      config[key] = conf[key];
    }
    // To Grafana Devs: With all of this code below, I get the feeling that
    // "there's an easier way" to do all of this that I'm not privvy to.
    // I looked over SoloPanelPage in particular to try my hand at a rewrite
    // and ended up right back at square one -- bootstrapping the entire application
    // from first principles. Do you guys have a better way of doing this stuff?
    //
    // NB: how do these 'setBackendSrv' etc things work? After looking at them
    // they're a singleton pattern that writes into the in-memory module namespace.
    // a nice pattern! Nicer still if a lot of these were self-configured in the
    // module namespace with an override function rather than relying on
    // bootstrapping to instantiate.
    //
    // cribbed from /public/app/app.ts#L130
    setBackendSrv(backendSrv);
    // cribbed from /public/app/app.ts#145
    setLocationSrv(locationService);
    // cribbed from /public/app/app.ts#203
    const dataSourceSrv = new DatasourceSrv();
    dataSourceSrv.init(conf.datasources, conf.defaultDatasource);
    setDataSourceSrv(dataSourceSrv);
    // cribbed from /public/app/app.ts#230
    const chromeService = new AppChromeService();
    // cribbed from /public/app/app.ts#231
    const keybindingService = new KeybindingSrv(locationService, chromeService);
    // cribbed from /public/app/app.ts#232-3. very likely this is nonsense we want to override/mock
    const newAssetsChecker = new NewFrontendAssetsChecker();
    newAssetsChecker.start();
    // more cribs form /public/app/app.ts
    const dashboardSrv = new DashboardSrv();
    setDashboardSrv(dashboardSrv);
    // force API URL fetcher not to append weird random dashboard state junk to initial URL
    locationService.push("/");
    // API Call has best security feels. Most likely to be approved by sec/legal
    const store = configureStore();
    // cribbed from /public/app/app.ts#L245
    GrafContext._appContext =  {
        backend: backendSrv,
        location: locationService,
        chrome: chromeService,
        keybindings: keybindingService,
        store: store,
        newAssetsChecker,
        conf,
    };
    // this is _absolutely_ necessary. After a big rewrite/reorg of all of this
    // code we definitely need to do the initDashboard shenanigans in here to
    // get this working at all.
    let initDashboardParams = {
      fixUrl: false,
      keybindingSrv: keybindingService,
      routeName: DashboardRoutes.Normal,
      urlUid: dashboardUid,
      urlSlug: "",
      urlType: "",
    };
    // the line below is a significant cleanup and improvement of my understanding
    // of what's intended to happen here. we're intented to use the redux store
    // to "dispatch" :eyeroll: this async wart. React. Go figure.
    return GrafContext._appContext.store.dispatch(initDashboard(initDashboardParams)).then(()=>{
      return GrafContext._appContext;
    });
  });
};


let bindToElementId = function(appContext: AppContext, dashboardUid: string, panelId: number, elementId: string, height: number, width: number){
  getPanel(appContext, dashboardUid, panelId, height, width).then(function(panelElem){
      let rootElem = document.getElementById(elementId)
      if(!rootElem || !panelElem) return
      let root = createRoot(rootElem);
      root.render(panelElem);
  })
}

// this should very likely be changed back over to the createRoot syntax
let bindToElement = function(appContext: AppContext, dashboardUid: string, panelId: number, element: HTMLElement, height: number, width: number){
  getPanel(appContext, dashboardUid, panelId, height, width).then(function(panelElem){
    if(!panelElem) return
    ReactDOM.render(panelElem, element);
  });
}

// dashCache and panelCache are here to overcome situations (observed in the wild)
// where the panel can have differing stateKeys from render to render. It's very likely
// that the grafana devs have a much better mechanism for this than this loose rig.
interface DC {[key:string]:DashboardModel}
interface PC {[key:string]:any|null}
const dashCache: DC = {}
const panelCache: PC = {}

function getPanel(appContext: AppContext, dashboardUid:string, panelId:number, height: number, width: number){
  if(!config.featureToggles.panelExporter){
    console.error("panel export requires 'panelExporter' grafana feature toggle")
    return Promise.resolve()
  }
  return getDashboardAPI().getDashboardDTO(dashboardUid).then(function(dashbrd:DashboardDTO){
    let dash = null;
    if(!dashCache[`${dashboardUid}`]){
      dash = new DashboardModel(dashbrd.dashboard);
      dashCache[`${dashboardUid}`] = dash;
    } else {
      dash = dashCache[`${dashboardUid}`];
    }
    let panel = null;
    if(!panelCache[`${dashboardUid}-${panelId}`]){
      let panel = dash.getPanelById(panelId);
      panelCache[`${dashboardUid}-${panelId}`] = panel;
    } else {
      panel = panelCache[`${dashboardUid}-${panelId}`];
    }
    if(!panel){ return }
    // this Provider call binds the store in a way that the rest of the app can find it
    return React.createElement(Provider, { store: appContext.store, children:
      // this one provides a lot of other state informationn and is consistent with
      // the current bootstrapping stuff in app.ts
      React.createElement(GrafanaContext.Provider, { value: appContext, children: 
          // here we actually create our dashboard panel
          // "lazy" is a very important value here. We probably always
          // want this set up like this in an external panel context.
          React.createElement(DashboardPanel, {
            stateKey: panel?.key,
            width: width,
            height: height,
            lazy: false,
            dashboard: dash,
            panel: panel,
            isEditing: false,
            isViewing: true,
            //isInView: false // TS says this doesn't exist anymore :_(
          })
      })
    })
  })
}

export const bindPanelToElement = bindToElement;
export const bindPanelToElementId = bindToElementId;
export const getPanelElement = getPanel;
export const Context = GrafContext;