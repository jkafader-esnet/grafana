import React, { useState } from "react";

class Chart extends React.Component {
    constructor(props) {
        super(props);
        this.domTarget = React.createRef();
    }

    componentDidMount() {
        let myElem = this.domTarget.current;
        let props = this.props;
        if(!window.Grafana) return;
        window.Grafana.GrafanaContext(this.props.dashboardUid).then(function (state) {
            // signature: function(stateObj, dashboardUid, panelId, HTML Element, height, width)
            window.Grafana.bindPanelToElement(
                state,
                props.dashboardUid,
                props.panelId,
                myElem,
                props.height,
                props.width
            );
        });
    }

    render() {
        let styles = {
            height: this.props.height + 20, // 20px for "safety"
            width: this.props.width + 20,
        };
        return <div className="grafana panel" ref={this.domTarget} style={styles} />;
    }
}

export { Chart };
export default Chart;