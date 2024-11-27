// FetchCoins.js

//const URI = 'http://distribuidoraarcox.com/api/';
import api from "../services/api";
import React, { createContext, useState, useEffect } from "react";

export default {
    async logIn(email,password) {
        try {
                //let response = await fetch(URI + 'login');
                let response = await api.post('login', {
                    email:email,
                    password:password,
                  });
                let responseJsonData = await response;
                console.log(response.data)
               
                return responseJsonData;
            }
        catch(e) {
            console.log(e)
        }
    }
}