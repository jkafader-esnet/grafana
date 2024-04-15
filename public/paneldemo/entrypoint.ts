import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';

import { registerEchoBackend, setEchoSrv, setQueryRunnerFactory, locationService, navigationLogger, setDataSourceSrv, getBackendSrv, setBackendSrv, setLocationSrv } from '@grafana/runtime';
import { setPanelRenderer } from '@grafana/runtime/src/components/PanelRenderer';
import { ErrorBoundaryAlert, GlobalStyles, ModalRoot, ModalsProvider } from '@grafana/ui';
import config from 'app/core/config';
import { profiler } from 'app/core/profiler';
import { GrafanaContext } from 'app/core/context/GrafanaContext';
import { KeybindingSrv } from 'app/core/services/keybindingSrv';
import { AppChromeService } from 'app/core/components/AppChrome/AppChromeService';
import { NewFrontendAssetsChecker } from 'app/core/services/NewFrontendAssetsChecker';
import { DashboardSrv, setDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import { initDashboard } from 'app/features/dashboard/state/initDashboard';
import { DatasourceSrv, getDatasourceSrv } from 'app/features/plugins/datasource_srv';
import { DashboardRoutes } from 'app/types';


import { backendSrv } from '../app/core/services/backend_srv.ts';
import { Echo } from '../app/core/services/echo/Echo';
import { ConfigContext, ThemeProvider } from '../app/core/utils/ConfigProvider';
import { DashboardPanel } from 'app/features/dashboard/dashgrid/DashboardPanel.tsx';
import { DashboardModel } from '../app/features/dashboard/state/DashboardModel.ts';
import { PanelModel } from '../app/features/dashboard/state/PanelModel.ts';
import { PanelRenderer } from '../app/features/panel/components/PanelRenderer';
import { QueryRunner } from '../app/features/query/state/QueryRunner';
import { setVariableQueryRunner, VariableQueryRunner } from '../app/features/variables/query/VariableQueryRunner';
import { configureStore } from '../app/store/configureStore.ts';


const GrafContext = function(dashboardUid) {
    if(GrafContext._appContext){
      return new Promise((resolve)=>{
        console.log("we have already initted the application. Returning appContext early.");
        resolve(GrafContext._appContext);
      })
    }
    // To Grafana Devs: With all of this code below, I get the feeling that
    // "there's an easier way" to do all of this that I'm not privvy to.
    // I looked over SoloPanelPage in particular to try my hand at a rewrite
    // and ended up right back at square one -- bootstrapping the entire application
    // from first principles. Do you guys have a better way of doing this stuff?
    // I sure don't after 2 serious tries at it.
    // 
    // NB: how to these 'setBackendSrv' etc things work? After looking at them
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
    dataSourceSrv.init(config.datasources, config.defaultDatasource);
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
    // config is "magically" bound to window.grafanaBootData.
    // we need some way to get window.grafanaBootData as a module,
    // or API call or something. API Call has best security feels.
    // most likely to be approved by sec/legal
    console.log('config is ', config);
    // cribbed from /public/app/app.ts#L245
    GrafContext._appContext =  {
        backend: backendSrv,
        location: locationService,
        chrome: chromeService,
        keybindings: keybindingService,
        store: configureStore(), // this is not used by GrafanaContext.Provider but is used by Provider to boostrap redux stuff
        newAssetsChecker,
        config,
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
      console.log("we have now initted the dashboard... presumably. Returning appContext");
      return GrafContext._appContext;
    });
};
// I'm pretty sure this getState thing is unnecessary and doesn't do anything
// at all currently. Particularly because it's broken at the moment. 
// (GrafContext._stateStore is always undefined).
// I think this is another (early) attempt to force a singleton pattern here.
GrafContext.getState = function(dashboardUid) {
    "use strict";
    if(GrafContext._stateStore){
        return new Promise(function(resolve, reject){
            resolve(GrafContext._stateStore);
        });
    } else {
       return GrafContext(dashboardUid)
    }
}

let bindToElementId = function(appContext, dashboardUid, panelId, elementId, height, width){
  getPanel(appContext, dashboardUid, panelId, height, width).then(function(panelElem){
      let rootElem = document.getElementById(elementId)
      let root = createRoot(rootElem);
      root.render(panelElem);
  })
}

// this should very likely be changed back over to the createRoot syntax
// but it's getting late and I'm tired
let bindToElement = function(appContext, dashboardUid, panelId, element, height, width){
  getPanel(appContext, dashboardUid, panelId, height, width).then(function(panelElem){
    console.log("rendering", panelElem, "under", element, "with ReactDOM.render");
    ReactDOM.render(panelElem, element);
    /*console.log("panelElem", panelElem, "element", element);
    let root = createRoot(element);
    console.log("root is", root);
    root.render(panelElem);
    console.log("completed render");*/
  });
}

// dashCache and panelCache are here to overcome situations (that I observed in the wild)
// where the panel can have differing stateKeys from render to render. It's very likely
// that the grafana devs have a much better mechanism for this than this loose rig.
const dashCache = {}
const panelCache = {}

let getPanel = function(appContext, dashboardUid, panelId, height, width){
  console.log("getPanel. appContext, dashboardUid, panelId, height, width", appContext, dashboardUid, panelId, height, width);
  return backendSrv.getDashboardByUid(dashboardUid).then(function(data){
    console.log("getPanel. after getDashboardByUid. data:", data);
    let dash = null;
    if(!dashCache[`${dashboardUid}`]){
      console.log("fresh dashboard. caching");
      dash = new DashboardModel(data.dashboard);
      dashCache[`${dashboardUid}`] = dash;
    } else {
      console.log("serving dashboard from cache");
      dash = dashCache[`${dashboardUid}`];
    }
    let panel = null;
    if(!panelCache[`${dashboardUid}-${panelId}`]){
      console.log("fresh panel. caching");
      let panel = dash.getPanelById(panelId);
      panelCache[`${dashboardUid}-${panelId}`] = panel;
    } else {
      console.log("serving panel from cache");
      panel = panelCache[`${dashboardUid}-${panelId}`];
    }
    console.log("getPanel. after getDashboardByUid. dash, panel:", dash, panel);
    // this Provider call binds the store in a way that the rest of the app can find it
    return React.createElement(Provider, { store: appContext.store },
      // this one provides a lot of other state informationn and is consistent with
      // the current bootstrapping stuff in app.ts
      React.createElement(GrafanaContext.Provider, appContext,
          // boom. here we actually create our dashboard panel
          // "lazy" is a very important value here. We probably always
          // want this set up like this in an external panel context.
          React.createElement(DashboardPanel, {
            stateKey: panel.key,
            width: width,
            height: height,
            lazy: false,
            dashboard: dash,
            panel: panel,
            isEditing: false,
            isViewing: true,
            isInView: false })
      )
    )
  });
}

export const bindPanelToElement = bindToElement;
export const bindPanelToElementId = bindToElementId;
export const getPanelElement = getPanel;
export const Context = GrafContext;


