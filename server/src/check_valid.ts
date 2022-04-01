import { validUsers} from './valid_users'
import { User } from './models/user'

interface UserLog {
    email: string;
    password: string;
}

export async function checkUser(reqBody: UserLog) {

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

// export function checkValidUserData (userObj: UserLog) {
//     const userEmail = userObj.email;
//     const isValid = (validUsers[userEmail] && (validUsers[userEmail] === userObj.password));

//     return isValid;
// }

