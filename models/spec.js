'use strict';
module.exports = (sequelize, DataTypes) => {
    const spec = sequelize.define('spec', {
        product_code: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        product_title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        detail_spec: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        underscored: true,
        freezeTableName: true, //Sequelize는 define method의 첫 번째 파라미터 값으로 tablename을 자동 변환하는데, 이 옵션의 값이 true이면 변환 작업을 하지 않도록 합니다.
        timestamps: false,
        // 이 옵션이 활성화되면 자동으로 createdAt열과 updatedAt열을 생성하고 데이터가 생성되었을 때와 
        // 수정되었을 때에 자동으로 갱신됩니다. 만약 false로 지정하면 이 열을 생성하지 않습니다. 기본값은 true입니다.
        tableName: "specs"
    });
    return spec;
}