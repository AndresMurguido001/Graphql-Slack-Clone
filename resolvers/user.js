import bcrypt from 'bcryptjs';

export default {
    Query: {
        getUser: (parent, { id }, { models }) => models.User.findOne({ where: { id } }),
        allUsers: (parent, args, { models }) => models.User.findAll(), 
    },
    Mutation: {
        registerUser: async (parent, {...otherargs, password}, { models }) => {            
            const hashPass = await bcrypt.hash(password, 10);
            try {
                await models.User.create({...otherargs, password: hashPass});
                return true; 
            } catch (error) {
                console.log(error);
                return false;
            }            
        },
    }
}