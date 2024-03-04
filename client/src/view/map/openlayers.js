import React, { useEffect, useState, useRef } from "react";

import { Button, Table, Form, Badge, Stack, Container, Row, Col }   from 'react-bootstrap';
import axios from 'axios';

//import Map1 from '../common/map copy';
import Map from '../common/map';

import GeoJSON from 'ol/format/GeoJSON.js';
import Feature from 'ol/Feature.js';
import {GeometryCollection, Point, Polygon, Circle, LineString} from 'ol/geom.js';

import '../../assets/css/flower.css';
import '../../assets/css/common.css';

/**
 * @author 꽃 종류 분석 및 분석 정보 표출 컴포넌트
 * @returns 꽃 종류 분석 HTML
**/
const formData = new FormData();//이미지 데이터 저장 Form

function Openlayers() {

    const [zoomType   , setZoomType]   = useState();
    const [actionType , setActionType] = useState();
    const [arrSource  , setArrSource]  = useState(() => { return []});

    const [circleCnt      , setCircleCnt    ] = useState(0);
    const [polygonCnt     , setPolygonCnt   ] = useState(0);
    const [pointCnt       , setPointCnt     ] = useState(0);
    const [lineStringCnt  , setLineStringCnt] = useState(0);
    const [geodesicCnt    , setGeodesicCnt  ] = useState(0);
    const [totalCnt       , setTotalCnt     ] = useState(0);
    const [insertCnt      , setInsertCnt    ] = useState(0);
    const [updateCnt      , setUpdateCnt    ] = useState(0);

    
    const childComponentRef = useRef({"type":"1"});

    //const [source, setSource] = useState();
  
    const getSource = async source => {
        saveFeature(source);
    };

    //이거공부하자 ------------------------> https://velog.io/@ahsy92/React-%EB%B6%80%EB%AA%A8%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8%EC%97%90%EC%84%9C-%EC%9E%90%EC%8B%9D%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8-%ED%95%A8%EC%88%98-%ED%98%B8%EC%B6%9C%ED%95%98%EA%B8%B0
    
    const handleClick = async (e, zoomType) => {
        
        if(zoomType == 'zoomIn'){
            await setZoomType('zoomIn');
        }
        else if(zoomType == 'zoomOut'){
            await setZoomType('zoomOut');
            
        }  
        childComponentRef.current.willBeUsedInParentComponent();
    };

    const mapControlHandler = async (actionType) => {
        
        if(actionType == 'clearSource'){
            await setActionType('clearSource');
            childComponentRef.current.willBeUsedInParentComponent();
        }
    };

    const cntOfFeatureType = async (featureType, idx) => {
        //console.log(props);
        setTotalCnt(totalCnt => totalCnt + 1);

        if(featureType == 'Geodesic'){ 
            setGeodesicCnt(geodesicCnt => geodesicCnt + 1);
        }
        else if(featureType == 'Circle'){
            setCircleCnt(circleCnt => circleCnt + 1);
        }
        else if(featureType == 'Polygon'){
            setPolygonCnt(polygonCnt => polygonCnt + 1);
        }
        else if(featureType == 'LineString'){
            setLineStringCnt(lineStringCnt => lineStringCnt + 1);
        }
        else if(featureType == 'Point'){
            setPointCnt(pointCnt => pointCnt + 1);
        }
    }

    /* 저장된 지오메트릭 데이터 불러오기 */
    const callFeature = async (feature) => {

        let response = await axios({
            method  : 'get',
            url     : '/api/geomboardList',
            params  : {
                id : "하위하위"
            },
            headers : {
                'Content-Type' : 'multipart/form-data'
            },
        })
            
        var datas =  response.data.rows;
        var array = Object.values(datas)

        /* 피쳐보이기 부터 해보자 */
        const featureArr = [];

        const promises = datas.map(async (value, index) => {

            let feature = new GeoJSON().readFeature(value.geom_value);

            let geometry = new GeoJSON().readFeature(value.geom_value);
            let properties = JSON.parse(value.geom_prop);
            let geomType = properties.type;

            // 원일 경우 Center와 Radius를 이용해 추가.
            if (geomType == 'Circle') {
                //console.log('--- Set Circle ---');
                let radius = properties.radius;//반지름
                let center = geometry.getGeometry().getCoordinates();//중심점 좌표

                feature = new Feature({
                    type: 'Feature',
                    geometry: new Circle(center, radius),
                });                
            }

            feature.setId(value.id);//ID값 세팅
            feature.setProperties(properties);//프로퍼티 값 세팅

            featureArr.push(feature);
        
            // 지오메트릭 타입별로 카운팅 
            cntOfFeatureType(geomType, index);
            
            
        });
        
        await Promise.all(promises);
        await setArrSource(featureArr);
    }
    
    const saveFeature = async (vectorLayer) => {
        console.log("데이터 저장하기");
        const featureArr = [];

        vectorLayer.getSource().forEachFeature(function(feature) {

            let cloneFeature = feature.clone();
            let featureId = feature.getId();
            let geomType = cloneFeature.getProperties().type;

            
            console.log(cloneFeature.getProperties());

            if(geomType == "Circle"){
                //Circle 객체를 Center와 Radius 프로퍼티를 가진 Point Feature로 변환
                let radius = cloneFeature.getGeometry().getRadius();
                let center = cloneFeature.getGeometry().getCenter();

                let feature = new Feature({
                    realType : cloneFeature.getProperties().realType,
                    type: geomType,
                    geometry: new Point(center),
                    radius: radius,
                });
                cloneFeature = feature;
            }

            cloneFeature.setId(featureId); // 저장할 Feature에 아이디값 세팅

            if(cloneFeature.getId() == undefined ){//신규 등록
                //console.log("ID : " + cloneFeature.getId()  + "/  인서트!" );

                cloneFeature.setProperties({"state" : "insert"});
            }
            else{//업데이트
                //console.log("ID : "+ cloneFeature.getId()  + "/  업데이트!" );
                cloneFeature.setProperties({"state" : "update"});
            }
            
            featureArr.push(cloneFeature);
        });

        var geoJsonClone = new GeoJSON().writeFeatures(featureArr);

        let response = await axios({
            method  : 'get',
            url     : '/api/geomboardSave',
            params  : {
                'geom' : geoJsonClone
            },
            headers : {
                'Content-Type' : 'multipart/form-data'
            }, 
        })
        if(response.status == 200){
            console.log(response.status);
            console.log("저장완료!!");

            await mapControlHandler("clearSource");
            await callFeature();
        } 
    }

    
    /* 공간 데이터 현황 업데이트 (1. 추가, 2. 변경) */
    const setRegAndModifyStatus = async (status) => {

        if(status == "Insert"){
            setInsertCnt(insertCnt => insertCnt + 1);
        }
        else if(status == "Update"){
            setUpdateCnt(updateCnt => updateCnt + 1);
        }
    }
    
    
    //이벤트 리스너 페이지 로드
    useEffect(() => {

        callFeature();
        
    }, []);
    
    
    //JSX 식으로 리스트 파싱
    return (
        <React.Fragment>
            <h1>오픈 레이어스</h1>
            <Row className='mb-3'>
                <Col>
                    <Stack direction="horizontal" gap={2}>
                        <Badge bg="info">Total: {totalCnt}</Badge>
                        <Badge bg="primary">polygone: {polygonCnt}</Badge>
                        <Badge bg="secondary">LineString: {lineStringCnt}</Badge>
                        <Badge bg="success">Point: {pointCnt}</Badge>
                        <Badge bg="danger">Circle: {circleCnt}</Badge>
                        <Badge bg="warning">Geodesic: {geodesicCnt}</Badge>
                    </Stack>
                </Col>
                <Col> 
                    <Stack className="float-end" direction="horizontal" gap={2}>
                        <Badge bg="light" text="dark">추가 : {insertCnt}</Badge>
                        <Badge bg="dark" text="light">변경 : {updateCnt}</Badge>
                    </Stack>
                </Col>
            </Row>

            <div className="my-3">
                <Map zoomType={zoomType} arrSource={arrSource} actionType={actionType} ref={childComponentRef} getSource={getSource} setRegAndModifyStatus={setRegAndModifyStatus}  />
            </div>  

            <Row>
                <Col className="d-grid gap-2"><Button variant="outline-success" id="zoom-out" onClick={(e) => { handleClick(e,'zoomOut');}}>Zoom out</Button></Col>
                <Col className="d-grid gap-2"><Button variant="outline-success" id="zoom-in" onClick={(e) => { handleClick(e,'zoomIn');}}>Zoom in</Button></Col>
            </Row> 
        </React.Fragment>
    )
}

export default Openlayers;