import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';

import { registerEchoBackend, setEchoSrv, setQueryRunnerFactory, locationService, navigationLogger, setDataSourceSrv, getBackendSrv, setBackendSrv } from '@grafana/runtime';
import { setPanelRenderer } from '@grafana/runtime/src/components/PanelRenderer';
import { ErrorBoundaryAlert, GlobalStyles, ModalRoot, ModalsProvider } from '@grafana/ui';
import config from 'app/core/config';
import { profiler } from 'app/core/profiler';
import { DashboardSrv, setDashboardSrv } from 'app/features/dashboard/services/DashboardSrv';
import { initDashboard } from 'app/features/dashboard/state/initDashboard';
import { DatasourceSrv, getDatasourceSrv } from 'app/features/plugins/datasource_srv';
import { DashboardRoutes } from 'app/types';

import { backendSrv } from '../app/core/services/backend_srv.ts';
import { Echo } from '../app/core/services/echo/Echo';
import { ConfigContext, ThemeProvider } from '../app/core/utils/ConfigProvider';
import { DashboardPanel } from '../app/features/dashboard/dashgrid/DashboardPanel.tsx';
import { DashboardModel } from '../app/features/dashboard/state/DashboardModel.ts';
import { PanelModel } from '../app/features/dashboard/state/PanelModel.ts';
import { PanelRenderer } from '../app/features/panel/components/PanelRenderer';
import { QueryRunner } from '../app/features/query/state/QueryRunner';
import { setVariableQueryRunner, VariableQueryRunner } from '../app/features/variables/query/VariableQueryRunner';
import { configureStore } from '../app/store/configureStore.ts';


import { AngularApp } from './angular/AngularApp';

let GrafContext = function(dashboardUid) {
    "use strict";
    // instead of having a single instance of `_stateStore`, we may want to have one for each dashboard uid passed in...
    // or actually probably we want to have a different mechanism to bind to a specific dashboard uid.
    if (GrafContext._stateStore) {
          // This allows the constructor to be called multiple times
          // and refer to the same instance. Another option is to
          // throw an error.
          return new Promise(function(resolve, reject){
              resolve(GrafContext._stateStore);
  	      });
    }
    GrafContext._stateStore = configureStore();

    console.log('profiler', profiler);
    profiler.window = {};
  
    setPanelRenderer(PanelRenderer);
    setQueryRunnerFactory(() => new QueryRunner());
    setVariableQueryRunner(new VariableQueryRunner());
    setEchoSrv(new Echo({ debug: true }));

    // Datasource variable $datasource with current value ''
    const templateSrv: any = {
      getVariables: () => [
        { type: 'datasource', name: 'datasource', current: { value: '', }, },
        { type: 'datasource', name: 'datasourceDefault', current: { value: 'default', }, },
      ],
      replace: (v: string) => {
        let result = v.replace('${datasource}', '');
        result = result.replace('${datasourceDefault}', 'default');
        return result;
      },
    };

    let datasourceSrv = new DatasourceSrv({}, {}, templateSrv);
    datasourceSrv.init(config.datasources, config.defaultDatasource);
    setDataSourceSrv(datasourceSrv);
    setBackendSrv(backendSrv);
    let dashboardSrv = new DashboardSrv();
    // possibly unnecessary: tested solution for "getDashboardQueryRunner can only be used after Grafana instance has started."
    setDashboardSrv(dashboardSrv);
 
    // possibly unnecessary: tested solution for "getDashboardQueryRunner can only be used after Grafana instance has started."
    let params = {
      urlSlug: '',
      urlUid: dashboardUid,
      urlType: "string", // XXX: is this correct???
      routeName: DashboardRoutes.Normal,
      fixUrl: false,
    };
    // the above and this maybe need to be split out into separate thingies.
    let initter = initDashboard(params);
    let hasInitted = initter(GrafContext._stateStore.dispatch, GrafContext._stateStore.getState);

    // return a promise that resolves when our application is finished initialization.
    return hasInitted.then(function(){ return GrafContext._stateStore });
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

let bindToElementId = function(store, dashboardUid, panelId, elementId, height, width){
  getPanel(store, dashboardUid, panelId, height, width).then(function(panelElem){
      let rootElem = document.getElementById(elementId)
      let root = createRoot(rootElem);
      root.render(panelElem);
  })
}

let bindToElement = function(store, dashboardUid, panelId, element, height, width){
  getPanel(store, dashboardUid, panelId, height, width).then(function(panelElem){
    console.log("panelElem", panelElem, "element", element);
    let root = createRoot(element);
    console.log("root is", root);
    root.render(panelElem);
    console.log("completed render");
  });
}

let getPanel = function(store, dashboardUid, panelId, height, width){
  console.log("getPanel. store, dashboardUid, panelId, height, width", store, dashboardUid, panelId, height, width);
  return backendSrv.getDashboardByUid(dashboardUid).then(function(data){
    console.log("getPanel. after getDashboardByUid. data:", data);
    let dash = new DashboardModel(data.dashboard);
    let panel = dash.getPanelById(panelId);
    console.log("getPanel. after getDashboardByUid. dash, panel:", dash, panel);
    return React.createElement(Provider, {
      store: store },
          React.createElement(DashboardPanel, {
            width: width,
            height: height,
            dashboard: dash,
            panel: panel,
            isEditing: false,
            isViewing: false,
            isInView: true })
      )
  });
}

export const bindPanelToElement = bindToElement;
export const bindPanelToElementId = bindToElementId;
export const getPanelElement = getPanel;
export const GrafanaContext = GrafContext;

