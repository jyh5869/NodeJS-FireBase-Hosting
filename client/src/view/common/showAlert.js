import React, { useState } from 'react';
import Alert from 'react-bootstrap/Alert';

/**
 * 토스트 창 표출 페이지
 * @returns
*/
export default function ShowAlert(props) {

    const toastTile = props.toastInfo.title
    const toastMsg  = props.toastInfo.message
    const showState = props.toastInfo.showState

    const showAlert_wrap = { position: "absolute", width: "100%", left :"0", right : "0", top : "25%"}
    const showAlert = { width: "fit-content", margin: "0 auto"}
    
    return (
        <div style={showAlert_wrap} >
            <Alert variant="info" show={showState} style={showAlert}  dismissible>
                <Alert.Heading>{toastTile}</Alert.Heading>
                <p>{toastMsg}</p>
            </Alert>
        </div>
    );
}

