import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

const Subscription = sequelize.define(
    "Subscription",
    {
        id_subscription: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        id_institution: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        id_plan: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM("trialing", "active", "past_due", "canceled"),
            defaultValue: "trialing",
        },
        trial_ends_at: DataTypes.DATE,
        current_period_start: DataTypes.DATE,
        current_period_end: DataTypes.DATE,
        cancel_at: DataTypes.DATE,
        billing_customer_id: DataTypes.STRING,
    },
    {
        tableName: "Subscriptions",
        freezeTableName: true,
        indexes: [{ fields: ["id_institution"] }],
    }
);

export default Subscription;
