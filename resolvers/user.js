import { tryLoggingIn } from '../auth';
import { formatErrors } from '../formatErrors';

export default {
    Query: {
        getUser: (parent, { id }, { models }) => models.User.findOne({ where: { id } }),
        allUsers: (parent, args, { models }) => models.User.findAll(), 
    },
    Mutation: {
        login: (parent, { email, password}, { models, SECRET, SECRET2 }) => tryLoggingIn(email, password, models, SECRET, SECRET2),
        registerUser: async (parent, args, { models }) => {            
            try {             
                let newUser = await models.User.create(args);
                return {
                    ok: true,
                    user: newUser
                };                                
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
