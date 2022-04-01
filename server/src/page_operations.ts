import * as fs from "fs";
import * as url from "url";
import * as config from "./config"
import mongoose from 'mongoose';
import { Image } from "./models/image";

const path = config.IMAGES_PATH;
let picOnPage: number;

interface responseObj {
    objects: object[];
    page: number;
    total: number;
}

interface Error{
    errorMessage: string;
}

function getLimit(reqURL: string) {
    console.log(reqURL);
    picOnPage = parseInt(url.parse(reqURL, true).query.limit as string);
    console.log(picOnPage);
}

async function getArrayLength () { //вычисляет количество картинок всего
    const imagesArr = await getImagesArr();
    const arrLength = imagesArr.length;
    
    return arrLength;
}

export async function getImagesArr() { //получает массив строк с адресами всех картинок
    
    let imagesArr = await fs.promises.readdir(path);
    return imagesArr;
}


async function getTotal(resObj: responseObj) { //вычисляет количество страниц 
    const picturesAmount = await getArrayLength();         // назначает TOTAL
    const pagesAmount = Math.ceil(picturesAmount / picOnPage);

    resObj.total = pagesAmount;

    return resObj;
}

function getCurrentPage(obj: responseObj, reqURL: string) { //назначает PAGE
    const requestedPage = url.parse(reqURL, true).query.page as string;
    
    obj.page = +requestedPage;
        
    return obj;
}

async function getRequestedImages(resObj: responseObj) { //назначает OBJECTS
   
    const arrForPage: object[] = [];
    const page = resObj.page;
    const picArr = await getImagesArr();

    for (let i = picOnPage * (page - 1); i < picOnPage * page; i++) {
        const imageIsExist = await Image.exists({id: i});
        if(imageIsExist) {
            let image = await Image.findOne({id: i})
            arrForPage.push(image);
        }
    }

    resObj.objects = arrForPage;

    return resObj;
}

function checkPage(resObj: responseObj) {
    if ((resObj.page > 0) && (resObj.page <= resObj.total)) {
        return resObj;
    } 

    return false;
}

export {getTotal, getCurrentPage, getLimit, getRequestedImages, checkPage, getArrayLength, responseObj};