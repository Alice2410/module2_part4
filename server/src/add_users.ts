import { User } from './models/user'
import { validUsers} from './valid_users'

export async function saveUser() {
    
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