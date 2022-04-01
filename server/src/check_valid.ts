import { validUsers} from './valid_users'

export interface UserLog {
    email: string;
    password: string;
}

export function checkValidUserData (userObj: UserLog) {
    const userEmail = userObj.email;
    const isValid = (validUsers[userEmail] && (validUsers[userEmail] === userObj.password));

    return isValid;
}

