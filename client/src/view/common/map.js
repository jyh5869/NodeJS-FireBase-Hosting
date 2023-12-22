import React,  { useEffect, useRef ,useState } from 'react';

import { Button, Table, Form, Badge, Stack, Container, Row, Col }   from 'react-bootstrap';

import axios from 'axios';
/*
교육 URL
https://openlayers.org/en/latest/examples/center.html
https://dev.to/camptocamp-geo/integrating-an-openlayers-map-in-vue-js-a-step-by-step-guide-2n1p
*/
import '../../assets/css/map.css';
import 'ol/ol.css';
import {Map as OlMap} from 'ol';
import GeoJSON from 'ol/format/GeoJSON.js';
//import OSM from 'ol/source/OSM.js';
//import TileLayer from 'ol/layer/Tile.js';
import View from 'ol/View.js';
import XYZ from 'ol/source/XYZ';

import {Draw, Modify, Snap} from 'ol/interaction.js';
import {GeometryCollection, Point, Polygon, Circle, LineString} from 'ol/geom.js';
import {circular} from 'ol/geom/Polygon.js';
import {getDistance} from 'ol/sphere.js';
import {transform} from 'ol/proj.js';
import {getCenter} from 'ol/extent';
import {Circle as CircleStyle, Stroke, Style, Fill} from 'ol/style.js';

import Feature from 'ol/Feature.js';
import {easeOut} from 'ol/easing.js';
import {fromLonLat, toLonLat} from 'ol/proj.js';
import {getVectorContext} from 'ol/render.js';
import {unByKey} from 'ol/Observable.js';
import Overlay from 'ol/Overlay.js';

import Select from 'ol/interaction/Select.js';
import {altKeyOnly, click, pointerMove, singleClick} from 'ol/events/condition.js';

import {get as getProjection } from 'ol/proj.js'; //위경도


import {OSM, Vector as VectorSource} from 'ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer.js';
import {toStringHDMS} from 'ol/coordinate.js';

import GeojsonTest from '../../openLayers/examples/data/geojson/switzerland.geojson';

import {Popover} from 'bootstrap';

const tileLayerXYZ = new TileLayer({
    source: new XYZ({ //source: new OSM()
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    })
});

const tileLayerOSM = new TileLayer({
    source: new OSM()
});

const source = new VectorSource({
    url: GeojsonTest,
    format: new GeoJSON(),
});

const vectorLayer = new VectorLayer({
    source: source,
    style: {
        'fill-color': 'rgba(255, 255, 255, 0.6)',
        'stroke-width': 1,
        'stroke-color': '#319FD3',
        'circle-radius': 5,
        'circle-fill-color': 'rgba(255, 255, 255, 0.6)',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#319FD3',
    },
});


const selected = new Style({
    fill: new Fill({
        color: 'rgba(255, 255, 255, 0.6)'
    }),
    stroke: new Stroke({
        color: '#f19ca3',
        width: 2,
    }),
});

function selectStyle(feature) {
    const color = feature.get('COLOR') || 'rgba(255, 255, 255, 0.6)';
    selected.getFill().setColor(color);
    return selected;
}

// select interaction working on "singleclick"
const selectSingleClick = new Select({style: selectStyle});

// select interaction working on "click"
const selectClick = new Select({
    condition: click,
    style: selectStyle,
});

// select interaction working on "pointermove"
const selectPointerMove = new Select({
    condition: pointerMove,
    style: selectStyle,
});

const selectAltClick = new Select({
    style: selectStyle,
    condition: function (mapBrowserEvent) {
        return click(mapBrowserEvent) && altKeyOnly(mapBrowserEvent);
    },
});

export const Map1 = (/*{ children, zoom, center }*/) => {

    const [mapObj, setMap] = useState();
    const [isDraw, setIsDraw] = useState(false);
    const [view, setView] = useState();
    const [zoom, setZoom] = useState();
    //const [drawType, setDrawType] = useState();
    //const [select, setSelect] = useState(selectSingleClick);

    const [featureInfo, setFeatureInfo] = useState(" 0 selected features ");

    //const [draw, setDraw] = useState();
    //const [modify, setModify] = useState();


        /*
    const [popupFeature, setPopupFeature] = useState();
    const [popupMap, setPopupMap] = useState();

    const [elementFeature, setElementFeature] = useState();
    const [elementMap, setElementMap] = useState();
    */
    const [popoverFeature, setPopoverFeature] = useState();
    const [popoverMap, setPopoverMap] = useState();

    //이벤트 리스너
    
    

    const [circleCnt      , setCircleCnt    ] = useState(0);
    const [polygonCnt     , setPolygonCnt   ] = useState(0);
    const [pointCnt       , setPointCnt     ] = useState(0);
    const [lineStringCnt  , setLineStringCnt] = useState(0);
    const [geodesicCnt    , setGeodesicCnt  ] = useState(0);
    const [totalCnt       , setTotalCnt     ] = useState(0);

    


    

    
    

    /* Feature Draw시 동학하며 마지막 포인트를 없애 이전으로 돌아간다. */
    const removeLastPoint = async () => {
        draw.removeLastPoint();
    };


    //지도 초기화
    /**
     * 
     *  ??? isDraw 왜자꾸 안바꼉?
     */
    const initMap = async (e) => {
        
        mapObj.removeInteraction(draw);
        mapObj.removeInteraction(snap);

        addInteractions(e)
    };

    let snap; let draw;
    const addInteractions = async (e) => {

        let value = e.target.value;
        let geometryFunction;

        if (value === 'Geodesic') {//측지선 Circle Feature

            value = 'Circle';

            geometryFunction = function (coordinates, geometry, projection) {

                if (!geometry) {
                    geometry = new GeometryCollection([
                    new Polygon([]),
                    new Point(coordinates[0]),
                    ]);
                }

                const geometries = geometry.getGeometries();
                const center = transform(coordinates[0], projection, 'EPSG:4326');
                const last = transform(coordinates[1], projection, 'EPSG:4326');
                const radius = getDistance(center, last);
                const circle = circular(center, radius, 128);

                circle.transform('EPSG:4326', projection);
                geometries[0].setCoordinates(circle.getCoordinates());
                geometry.setGeometries(geometries);

                return geometry;
            };
        }

        draw = new Draw({
            source: source,
            type: value,
            geometryFunction: geometryFunction,
        });
        snap = new Snap({source: source});
        
        mapObj.addInteraction(draw);
        mapObj.addInteraction(snap);

        //setDraw(draw);
        //setDrawType(e.target.value);
        drawType = e.target.value;
        setIsDraw(true);
        select.set("drawYn","Y")

        console.log('isDraw = ' + drawType);
    }

    //Map 객채에 특정 인터렉션(Interation)을 제거
    function removeInteraction(interactionType){

        if(interactionType == "draw"){
            console.log("인터렉션 제거! : draw" );
            mapObj.removeInteraction(draw);
            setIsDraw(false);
        }
        else if(interactionType == "snap"){
            mapObj.removeInteraction(snap);
        }
    }

    /* Select 이벤트 발생시 해당 이벤트의 정보 */
    const selectFeatureInfoBox = async(event, selectType) => {

        if(selectType == "FEATURE"){
            document.getElementById('status').innerHTML =
            '&nbsp;' +
            event.target.getFeatures().getLength() +
            ' selected features (last operation selected ' +
            event.selected.length +
            ' and deselected ' +
            event.deselected.length +
            ' features)';
        }
        else{
            document.getElementById('status').innerHTML = "지도 클릭 선택된 피쳐가 없습니다."
        }
    };
    let drawType;
    source.on('addfeature', function (e) {
        //console.log("피쳐추가 시작11 :  draw Type : " + drawType);
        //피쳐 추가시 Type Propertiy 세팅
        if(drawType == 'Geodesic'){ 
            console.log("피쳐추가 Geodesic");
            e.feature.set('realType', 'GeometryCollection');
            e.feature.set('type'    , 'Geodesic');
        }
        else if(drawType == 'Circle'){
            console.log("피쳐추가 Circle");
            e.feature.setProperties({'realType':'Circle', 'type':'Circle'})
        }
        else if(drawType == 'Polygon'){
            console.log("피쳐추가 Polygon");
            e.feature.setProperties({'realType':'Polygon', 'type':'Polygon'})
        }
        else if(drawType == 'LineString'){
            console.log("피쳐추가 LineString");
            e.feature.setProperties({'realType':'LineString', 'type':'LineString'})
        }
        else if(drawType == 'Point'){
            console.log("피쳐추가 Point");
            e.feature.setProperties({'realType':'Point', 'type':'Point'})
        }

        if(drawType != undefined){
            flash(e);
        } 
    });
    
    /* 생성한 피쳐를 맵에 추가 */
    const duration = 3000;
    const  flash = async(e) => {
        //console.log("피쳐 추가!22");

        let feature = e.feature;

        const start = Date.now();
        const flashGeom = feature.getGeometry().clone();
        const listenerKey = tileLayerXYZ.on('postrender', animate);
        
        function animate(event) {
            const frameState = event.frameState;
            const elapsed = frameState.time - start;
            
            if (elapsed >= duration) {
                unByKey(listenerKey);
                return;
            }

            const vectorContext = getVectorContext(event);
            const elapsedRatio = elapsed / duration;
            // radius will be 5 at start and 30 at end.
            const radius = easeOut(elapsedRatio) * 25 + 5;
            const opacity = easeOut(1 - elapsedRatio);
        
            const style = new Style({
                image: new CircleStyle({
                    radius: radius,
                    stroke: new Stroke({
                    color: 'rgba(255, 0, 0, ' + opacity + ')',
                    width: 0.25 + opacity,
                    }),
                }),
            });
        
            vectorContext.setStyle(style);
            vectorContext.drawGeometry(flashGeom);

            // tell OpenLayers to continue postrender animation
            mapObj.render();
        }

        //Draw Interation 종료             
        removeInteraction("draw");
        select.set("drawYn","N");
        //console.log("isdraw: 그리기종료 후 :  " + select.get("drawYn"));

    }










    let select = selectSingleClick;
    select.on('select', function (e) {
        //console.log("피쳐 선택! drawYn = " + select.get("drawYn") + "       /           " + drawType);

        //if(select.get("drawYn") == 'Y'){ return false};

        selectFeatureInfoBox(e, "FEATURE");
        
        if(e.target.getFeatures().getLength() != 0){

            e.target.getFeatures().forEach(function(feature, idx){

                let geomType = feature.getProperties().type;
                let center;
                //console.log(feature);

                //피쳐 추가시 Type Propertiy 세팅
                if(geomType == 'Geodesic'){ 
                    console.log('Geodesic');
                    center = getCenter(feature.getGeometry().getExtent());
                }
                else if(geomType == 'Circle'){
                    console.log('Circle');
                    center = feature.getGeometry().getCenter();
                }
                else if(geomType == 'Polygon'){
                    console.log('Polygon');
                    center = getCenter(feature.getGeometry().getExtent());
                }
                else if(geomType == 'LineString'){
                    console.log('LineString');
                    center = getCenter(feature.getGeometry().getExtent());
                }
                else if(geomType == 'Point'){
                    console.log('Point');
                    center = feature.getGeometry().getCoordinates();
                }

                //if(popupFeature == undefined){return false}
                if(mapObj == undefined){return false}

                const popupFeature = new Overlay({
                    element: document.getElementById('popup'),
                });

                mapObj.addOverlay(popupFeature);
                const elementFeature = popupFeature.getElement();
                let popoverFeature = Popover.getInstance(elementFeature);//팝오버 객체 생성

                //popup.setPosition(coordinate);
                popupFeature.setPosition(center);
                //console.log(center);
                
                setPopoverFeature(popoverFeature);

                if (popoverFeature) {
                    popoverFeature.dispose();
                }
                
                popoverFeature = new Popover(elementFeature, {
                    animation: false,
                    container: elementFeature,
                    content: '<p>클릭한 위치의 피쳐 정보:</p><code>' + center + '</code>',
                    html: true,
                    placement: 'top',
                    title: 'Welcome to OpenLayers',
                });
                
                //팝오버 표출
                popoverFeature.show();

            });
        }      
    });


    /**
     * 지도 클릭시 피쳐가 없는 부분에 팝업 띄우기
     */

    const changeInteraction = function (clickType) {

        if (select !== null) {
            mapObj.removeInteraction(select);
        }

        const value = clickType;


        if (value == 'singleclick') {
            select = selectSingleClick;
            //setSelect(selectSingleClick);
        } else if (value == 'click') {
            select = selectClick;
            //setSelect(selectClick);
        } else if (value == 'pointermove') {
            select = selectPointerMove;
            //setSelect(selectPointerMove);
        } else if (value == 'altclick') {
            select = selectAltClick;
            //setSelect(selectAltClick);
        } else {
            select = selectClick;
            //setSelect(selectClick);
        }
        
        if (select !== null) {

            mapObj.addInteraction(select);

            select.on('select', function (e) {

                selectFeatureInfoBox(e, "MAP");
                console.log("이벤트 발생 Value : " + value);
                
                if(e.target.getFeatures().getLength() != 0){
        
                    e.target.getFeatures().forEach(function(feature, idx){
        
                        let geomType = feature.getProperties().type;
                        let center;
        
                        //피쳐 추가시 Type Propertiy 세팅
                        if(geomType == 'Geodesic'){ 
                            console.log('Geodesic');
                            center = getCenter(feature.getGeometry().getExtent());
                        }
                        else if(geomType == 'Circle'){
                            console.log('Circle');
                            center = feature.getGeometry().getCenter();
                        }
                        else if(geomType == 'Polygon'){
                            console.log('Polygon');
                            center = getCenter(feature.getGeometry().getExtent());
                        }
                        else if(geomType == 'LineString'){
                            console.log('LineString');
                            center = getCenter(feature.getGeometry().getExtent());
                        }
                        else if(geomType == 'Point'){
                            console.log('Point');
                            center = feature.getGeometry().getCoordinates();
                        }
                        
                        const popupFeature = new Overlay({
                            element: document.getElementById('popup'),
                        });
                        mapObj.addOverlay(popupFeature);
                        const elementFeature = popupFeature.getElement();
                        let popoverFeature = Popover.getInstance(elementFeature);//팝오버 객체 생성

                        popupFeature.setPosition(center);
                        
                        if (popoverFeature) {
                            popoverFeature.dispose();
                        }
                        
                        popoverFeature = new Popover(elementFeature, {
                            animation: false,
                            container: elementFeature,
                            content: '<p>클릭한 위치의 피쳐 정보:</p><code>' + center + '</code>',
                            html: true,
                            placement: 'top',
                            title: 'Welcome to OpenLayers',
                        });
            
                        //팝오버 표출
                        popoverFeature.show();
                    });
                }      
            });
        }
    };

    source.on('selectfeature', function (e) {
        console.log("피쳐선택!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        select.set("drawYn","N");
        flash(e.feature);
    });

    console.log("로드시 isdraw : " + isDraw);

    const defaultStyle = new Modify({source: source})
    .getOverlay()
    .getStyleFunction();

    let modify = new Modify({
        source: source,
        style: function (feature) {
            feature.get('features').forEach(function (modifyFeature) {

                const modifyGeometry = modifyFeature.get('modifyGeometry');

                if (modifyGeometry) {
                    const modifyPoint = feature.getGeometry().getCoordinates();
                    const geometries = modifyFeature.getGeometry().getGeometries();
                    const polygon = geometries[0].getCoordinates()[0];
                    const center = geometries[1].getCoordinates();
                    const projection = mapObj.getView().getProjection();
                    let first, last, radius;

                    if (modifyPoint[0] === center[0] && modifyPoint[1] === center[1]) {
                        // center is being modified
                        // get unchanged radius from diameter between polygon vertices
                        first = transform(polygon[0], projection, 'EPSG:4326');
                        last = transform(
                            polygon[(polygon.length - 1) / 2],
                            projection,
                            'EPSG:4326'
                        );
                        radius = getDistance(first, last) / 2;
                    } else {
                        // radius is being modified
                        first = transform(center, projection, 'EPSG:4326');
                        last = transform(modifyPoint, projection, 'EPSG:4326');
                        radius = getDistance(first, last);
                    }

                    // update the polygon using new center or radius
                    const circle = circular(
                        transform(center, projection, 'EPSG:4326'),
                        radius,
                        128
                    );

                    circle.transform('EPSG:4326', projection);
                    geometries[0].setCoordinates(circle.getCoordinates());
                    // save changes to be applied at the end of the interaction
                    modifyGeometry.setGeometries(geometries);
                }
            });

            return defaultStyle(feature);
        },
    });

    useEffect(() => {

        callFeature();

        const map = new OlMap({
            layers: [
                tileLayerXYZ,
                vectorLayer
            ],
            target: 'map', 
            view: new View({
                projection: getProjection('EPSG:3857'),
                center: fromLonLat([126.752, 37.4713], getProjection('EPSG:3857')),
                zoom: 6
            })
        })
        console.log("맵세팅!");
        const view = map.getView();
        const zoom = view.getZoom();

        setView(view);
        setZoom(zoom);

        setMap(map);


        /*
        setPopupFeature(popupFeature);
        setPopupMap(popupMap);
        
        setElementMap(elementMap);
        setElementFeature(elementFeature);

        setPopoverFeature(popoverFeature);
        setPopoverMap(popoverMap);
        */

        map.addInteraction(selectSingleClick);
        

        //Map 객채에 수정 인터렉션(Interation) 추가
        map.addInteraction(modify);
        //setModify(modify);

        modify.on('modifystart', function (event) {
            setIsDraw(true);
            console.log("수정 시작" + isDraw);
            
            event.features.forEach(function (feature) {
                const geometry = feature.getGeometry();
                if (geometry.getType() === 'GeometryCollection') {
                    feature.set('modifyGeometry', geometry.clone(), true);
                }
            });
        });
    
        modify.on('modifyend', function (event) {
            
            setIsDraw(false);
            console.log("수정 종료" + isDraw);
            event.features.forEach(function (feature) {
                const modifyGeometry = feature.get('modifyGeometry');
                if (modifyGeometry) {
                    feature.setGeometry(modifyGeometry);
                    feature.unset('modifyGeometry', true);
                }
            });
        });
        


        /*
        let draw = new Draw({
            source: source,
            type: "Polygon"
        });
        setDraw(draw);



        draw.on('drawstart', function (e) {
            console.log("그리기 시작");
        }); 

        draw.on('drawend', function (e) {
            select.set("drawYn", "N");
            console.log("그리기 끝");
            map.removeInteraction(draw);
        }); 
*/



        map.on('click', function (evt) {
        
            if(isDraw == true){ return false}

            console.log("지도 클릭시 위치정보 Overlay : " + isDraw);
            let popupMap = new Overlay({
                element: document.getElementById('popupMap'),
            });
            map.addOverlay(popupMap);
            let elementMap = popupMap.getElement();
            let popoverMap = Popover.getInstance(elementMap);//팝오버 객체 생성
    



            let coordinate = evt.coordinate;
            let hdms = toStringHDMS(toLonLat(coordinate));
            let feature = map.forEachFeatureAtPixel(evt.pixel, function (feature) {return feature;});//피쳐가 있을시 피쳐를 반환
            
            if (feature == undefined) {
                
                selectFeatureInfoBox(evt, "MAP");
    
                popupMap.setPosition(coordinate);
             
                if (popoverMap) {
                    popoverMap.dispose();
                }
                
                popoverMap = new Popover(elementMap, {
                    animation: false,
                    container: elementMap,
                    content: '<p>클릭한 부분의 위치정보</p><code>' + hdms + '</code>',
                    html: true,
                    placement: 'top',
                    title: 'Welcome to OpenLayers',
                });
    
                //지도클릭 팝오버 표출 및 피쳐 팝오버 비활성화
                popoverMap.show();


                let popupFeature = new Overlay({
                    element: document.getElementById('popup'),
                });
                map.addOverlay(popupFeature);
                let elementFeature = popupFeature.getElement();
                let popoverFeature = Popover.getInstance(elementFeature);//팝오버 객체 생성

            }
            else{
                //팝오버 존재시 숨기기
                if(popoverMap != null){
                    popoverMap.hide();
                }
            }
        });

        /* 지도 포인트 이동시 이벤트 */
        map.on('pointermove', function (e) {
            if (!e.dragging) {
                var pixel = map.getEventPixel(e.originalEvent);
                var hit = map.hasFeatureAtPixel(pixel);
            }
        });

        

        
        return ()=> null
    },  []);

    



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
        //console.log(datas);

        /* 피쳐보이기 부터 해보자 */
        const featureArr = [];
        //datas.forEach(async function(value, index){
        //for (const [idx, value] of datas.entries()) {
        const promises = datas.map(async (value, index) => {

            let feature = new GeoJSON().readFeature(value.geom_value);

            let geometry = new GeoJSON().readFeature(value.geom_value);
            let properties = JSON.parse(value.geom_prop);
            let geomType = properties.type;
            //console.log( "11111111111  "+ index);
            // 원일 경우 Center와 Radius를 이용해 추가.
            if (geomType == 'Circle') {
                console.log('--- Set Circle ---');
                let radius = properties.radius;//반지름
                let center = geometry.getGeometry().getCoordinates();//중심점 좌표

                feature = new Feature({
                    type: 'Feature',
                    geometry: new Circle(center, radius),
                });                
            }
            //console.log("22222222222222  " + index);
            feature.setId(value.id);//ID값 세팅
            feature.setProperties(properties);//프로퍼티 값 세팅

            featureArr.push(feature);
        
            //console.log(properties);
            //console.log("333333333333  " + index);
            // 지오메트릭 타입별로 카운팅 
            cntOfFeatureType(geomType, index);
            //console.log("444444444444  " + index);
        });
        
        await Promise.all(promises);

        
        console.log(source);
        source.addFeatures(featureArr);

    }

    /* 지오메트릭 타입별 갯수 표출 함수 */
    const cntOfFeatureType = async (featureType, idx) => {

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




    return (
        <>
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
                        <Badge bg="light" text="dark">추가 : </Badge>
                        <Badge bg="dark" text="light">변경 : </Badge>
                    </Stack>
                </Col>
            </Row>

            {/* <div ref={mapId} className='map'>
                {children}
            </div> */}

            <div id="map" value={mapObj} style={{height:'50rem'}}></div>
            <Row className='mb-3'>
                <Col className="text-center" id="status" >{featureInfo}</Col>
            </Row>

            <Row className='mb-3'>
                <Col>
                    <div className="input-group">
                        <label className="input-group-text" htmlFor="type">Geometry type</label>
                        <Form.Select id="type" onChange={(e) => { initMap(e);} } value={drawType}>
                            <option key={0} value="" >선택하세요</option>
                            <option key={1} value="Point" >Point</option>
                            <option key={2} value="LineString">LineString</option>
                            <option key={3} value="Polygon">Polygon</option>
                            <option key={4}value="Circle">Circle Geometry</option>
                            <option key={5} value="Geodesic">Geodesic Circle</option> 
                        </Form.Select>
                        <Button variant="outline-primary" onClick={(e) => { removeLastPoint();}}>이전으로</Button>
                    </div>
                </Col>
                <Col>
                    <div className="input-group">
                        <label className="input-group-text" htmlFor="type2">Action type &nbsp;</label>

                        <Form.Select id="type2" onChange={(e) => { changeInteraction(e.target.value);}} defaultValue={"none"}>
                            <option key={1} value="click">Click</option>
                            <option key={2} value="singleclick">Single-click</option>
                            <option key={3} value="pointermove">Hover</option>
                            <option key={4} value="altclick">Alt+Click</option>
                            <option key={5} value="none">None</option>
                        </Form.Select>
                    </div>
                </Col>
            </Row>

            <div id="popup"></div>
            <div id="popupMap"></div>
            <div id="selectPopup"></div>
        </>
    );
}
  
export default Map1;

