export default (sequelize, DataTypes) => {
    let Member = sequelize.define('member', {
        admin: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    });
        return Member;
};