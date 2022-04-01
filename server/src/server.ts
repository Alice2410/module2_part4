import * as http from "http";
import * as config from "./config"
import express, {NextFunction, Request, Response} from "express";
import upload, { UploadedFile } from "express-fileupload";
import { checkValidUserData, UserLog } from './check_valid';
import * as pageOperations from './page_operations';
import { responseObj } from "./page_operations";
import morgan from 'morgan'
import * as rfs from "rotating-file-stream";
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from './models/user'
import { validUsers } from "./valid_users";


const token = { token: "token" };
const PORT = 5000;
const app = express();

dotenv.config()
const dbURL = process.env.DB_CONN as string;

async function connectToDB() {
    let connectRes = await mongoose.connect(dbURL);
    console.log('connected to DB'); 
}

connectToDB();
saveUser()

async function saveUser() {
    
    try {
        let userEmailsArr = Object.keys(validUsers);
        console.log('users arr: ' + userEmailsArr);
        console.log('length: ' + userEmailsArr.length);

        for (let i = 0; i < userEmailsArr.length; i++) {

            let userEmail = userEmailsArr[i];
            console.log('user email: ' +userEmail);
            let userIsExist = await User.exists({email: userEmail});

            if (!userIsExist) {
                try{
                    console.log('user exist: ' + userIsExist)
                    console.log('password: ' + validUsers[userEmail])
                    let user = await User.create({email: userEmail, password: validUsers[userEmail]})
                    console.log('user obj: ' + user);
                } catch(err) {
                    let error = err as Error;
                    console.log(error.message)
                }
            }
            
        }
    } catch (err) {
        let error = err as Error;
        console.log(error.message)
    }
}

async function checkUser(reqBody: UserLog) {
    
    try {
        const userEmail = reqBody.email;
        const userIsExist = await User.exists({email: userEmail});

        if(userIsExist) {
            const userData = await User.find({email: userEmail});
            const validPassword: string = userData[0].password;
            const isValid = (reqBody.password === validPassword);

            return isValid;
        } 

        return false;
    } catch(err) {
        let error = err as Error;
        console.log(error.message)
    }
}
 


const generator = () => {
    let ISOTime = (new Date(Date.now())).toISOString().slice(0, -5).replace( /[T]/, '_');

    return ISOTime;
};

let accessLogStream = rfs.createStream( generator, {
    interval: '1h',
    path: config.LOG_PATH,
});

app.use(morgan('tiny', { stream: accessLogStream }))

app.use('/', express.static(config.SCRIPTS_STATIC_PATH), express.static(config.SOURCES_STATIC_PATH));

app.use(express.json());

app.post('/authorization', async (req, res) => {
    let result = await checkUser(req.body);
    if (result) { //проверка данных пользователя

        res.statusCode = 200;
        res.end(JSON.stringify(token));
    } else {

        res.sendStatus(403);
    }
    
})

app.use(upload())

app.use('/gallery', checkToken)

app.post('/gallery', async (req, res) => {
    
    try{
        if(!req.files) {
            throw new Error('Ошибка загрузки. Картинка не сохранена')
        } else {
            
            let file = req.files.file as UploadedFile;

            getUploadedFileName(file, res)
        }
    } catch(err) {
        let error = err as Error
        res.status(500).send(error);
    }
    
});

app.get('/gallery', async (req, res) => {
               
        const reqUrl = req.url;
        const resObj = {
            objects: [''],
            page: 0,
            total: 0,
        }

        try {
            await sendResponse(resObj, reqUrl, res);
        } catch (error) {
            console.log(error);
        }
        
})

app.use((req, res) => {
    res.redirect('http://localhost:5000/404.html')
})

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function sendNotFoundStatus (resObj: responseObj, res: http.ServerResponse) {

    if (!pageOperations.checkPage(resObj)) {
        res.statusCode = 404;
        res.end();
        return false;
    } 

    return resObj;
}

async function sendResponse (resObj: responseObj, reqUrl: string, res: http.ServerResponse) {
    
    pageOperations.getLimit(reqUrl);
    await pageOperations.getTotal(resObj);
    pageOperations.getCurrentPage(resObj, reqUrl);

    try {
        if (sendNotFoundStatus(resObj, res)) {
            await pageOperations.getRequestedImages(resObj);
            res.statusCode = 200;
            res.end(JSON.stringify(resObj));
        }
    } catch (err) {
        return err;
    }
}

async function getUploadedFileName(file: UploadedFile, res: Response) {
    
    let fileName = file.name;
    let noSpaceFileName = fileName.replace(/\s/g, '');
    let number = await pageOperations.getArrayLength() + 1;

    let newFileName = 'user-' + number + '_' +  noSpaceFileName;

    file.mv((config.IMAGES_PATH + newFileName), (err: Error) => {
    
        if(err){
            res.send (err);
        } else {
            res.end() 
        }
    })
}

function checkToken (req: Request, res: Response, next: NextFunction) {
    const headers = req.headers;

    if (headers.authorization === 'token') {  
        next()
    } else {
        res.sendStatus(403);
        next()
    }
}
