
import React, { useEffect, useState } from "react";
import { Route, Routes, useLocation, useNavigate  } from 'react-router-dom';
import { Navbar, Nav, NavDropdown, Form, Button, FormControl } from 'react-bootstrap';

import axios from 'axios';

import ShoseDetail     from './view/shose/shoseDetail';
import ShoseList       from './view/shose/shoseList';
import MovieList       from './view/movie/movieList';
import MovieDetail     from './view/movie/movieDetail';
import FlowerAnalysis  from './view/flower/flowerAnalysis';
import FlowerMngClass  from './view/flower/flowerMngClass';
import FlowerTrainHist from './view/flower/FlowerTrainHist';
import Login           from './view/common/login';

import './assets/css/common.css';

import logo from './logo.svg';
let currentPath = "";
function App() {

    let [isLogIn , setIsLogIn] = useState();

    const navigate = useNavigate();
    const location = useLocation();

    const AuthHandler = async (useParams, e) => {  
        let authType = useParams.authType
        console.log("검증");
        let response = axios({
            method  : 'get',
            url     : '/api/userAuthority',
            params  : {
                authType : authType
            },
            headers : {
                'Content-Type' : 'multipart/form-data'
            }

        }).then(function(res){
            setIsLogIn(Boolean(res.data.isLogin))

            if (Boolean(res.data.isLogin) == false) {
                navigate("/" , {state : location.pathname});
            } 
        });
    }

    
    useEffect(() => {
        //로그인 페이지를 제외한 사용자 권한 검증
        if(location.pathname != "/"){
            AuthHandler({useParams : "verify"});
        }

        //같은 경로를 클릭 및 조회 할경우 새로고침 처리
        if(currentPath == location.pathname) {
            window.location.reload(); 
        }
        currentPath = location.pathname;

    }, [location]);
    
    return(
        <div>
            {isLogIn == true ? 
            <header>
                <Navbar bg="light" expand="lg" >
                    <Navbar.Brand href="/view/flower/flowerAnalysis">{' '}
                        <img alt="" src={logo} width="40" height="40" className="d-inline-block align-top mt-n1"/>Deep Learning World</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav className="ml-auto">
                            {/* <Nav.Link href="/view/list">Shoes</Nav.Link> */}
                            <Nav.Link href="/view/movieList">Movie</Nav.Link>
                            <NavDropdown title="Flower" id="basic-nav-dropdown">
                                <NavDropdown.Item href="/view/flower/flowerAnalysis">flower Analysis</NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item href="/view/flower/flowerTrainHist">model Training schedules</NavDropdown.Item>
                                <NavDropdown.Item href="/view/flower/flowerMngClass">Add flowerClass</NavDropdown.Item>
                            </NavDropdown>
                            <NavDropdown title="User" id="basic-nav-dropdown">
                                {isLogIn == true ? 
                                    <NavDropdown.Item href="/"  onClick={(e) => { AuthHandler({authType : "logOut"}, e)}}>Log out</NavDropdown.Item>
                                : 
                                    <NavDropdown.Item href="/">Log in</NavDropdown.Item>
                                }
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>
                    <Form className="form1" >
                        <FormControl type="text" placeholder="검색어를 입력하세요." className="mr-sm-2" />
                        <Button variant="outline-success" >검색</Button>
                    </Form>
                </Navbar>
            </header>
            : "" }
            <div className="container pt-3">
                <Routes>
                    <Route path="/" element={<Login/> }></Route>
                    <Route path="/view/list/" element={ <ShoseList /> }></Route>
                    <Route path="/view/detail/:id" element={ <ShoseDetail/> }></Route>
                    <Route path="/view/movieList" element={ <MovieList/> } ></Route>
                    <Route path="/view/movieDetail/:id" element={ <MovieDetail/> } ></Route>
                    <Route path="/view/flower/flowerAnalysis" element={ <FlowerAnalysis/> } ></Route>
                    <Route path="/view/flower/flowerMngClass" element={ <FlowerMngClass/> } ></Route>
                    <Route path="/view/flower/flowerTrainHist" element={ <FlowerTrainHist/> } ></Route>
                </Routes>
            </div>
        </div>
    )
}

export default App; 
