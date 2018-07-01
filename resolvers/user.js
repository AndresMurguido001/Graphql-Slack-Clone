import bcrypt from 'bcryptjs';
import _ from "lodash";
import { tryLoggingIn } from '../auth';

const formatErrors = (e, models) => {
    if (e instanceof models.sequelize.ValidationError){
        return e.errors.map(x => _.pick(x, ["path", "message"]));
    }
    return  [{path: "name", message: "something went wrong"}];
}

export default {
    Query: {
        getUser: (parent, { id }, { models }) => models.User.findOne({ where: { id } }),
        allUsers: (parent, args, { models }) => models.User.findAll(), 
    },
    Mutation: {
        login: (parent, { email, password}, { models, SECRET, SECRET2 }) => tryLoggingIn(email, password, models, SECRET, SECRET2),
        registerUser: async (parent, {...otherargs, password}, { models }) => {            
            const hashPass = await bcrypt.hash(password, 10);
            try {
                if (password.length < 5 || password.length > 20 ){
                    return {
                        ok: false,
                        errors: [{path: "password", message: "Password must be between 5 and 20 characters"}]
                    };                   
                } else {
                    let newUser = await models.User.create({...otherargs, password: hashPass});
                    return {
                        ok: true,
                        user: newUser
                    };
                }                    
            } catch (error) {
                console.log(error);
                return {
                    ok: false,
                    errors: formatErrors(error, models)
                };
            }            
        },
    }
}
