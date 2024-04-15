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
    const dashboardSrv = new DashboardSrv();
    setDashboardSrv(dashboardSrv);
    locationService.push("/"); // force url fetcher not to append weird random dashboard state to initial URL
    // config is "magically" bound to window.grafanaBootData.
    // we need some way to get window.grafanaBootData as a module,
    // or API call or something
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
    let initDashboardParams = {
      fixUrl: false,
      keybindingSrv: keybindingService,
      routeName: DashboardRoutes.Normal,
      urlUid: dashboardUid,
      urlSlug: "",
      urlType: "",
    };
    return GrafContext._appContext.store.dispatch(initDashboard(initDashboardParams)).then(()=>{
      console.log("we have now initted the dashboard... presumably. Returning appContext");
      return GrafContext._appContext;
    });
};
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
    return React.createElement(Provider, { store: appContext.store },
      React.createElement(GrafanaContext.Provider, appContext,
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


