import { con } from "./index"

export function setupDatabaseTables() {
    con.query('CREATE TABLE IF NOT EXISTS `events` (`id` INT AUTO_INCREMENT, `name` VARCHAR(255) NOT NULL, `startTime` DATETIME NOT NULL, `endTime` DATETIME NOT NULL, `categories` VARCHAR(255), PRIMARY KEY (`id`));', function (err: any, result: any, fields: any) {
        if (err) throw err
        console.log("events table created if not exists")
    })

    con.query('CREATE TABLE IF NOT EXISTS `data` (`datakey` VARCHAR(30) NOT NULL, `datavalue` MEDIUMTEXT NOT NULL, PRIMARY KEY (`datakey`))', function (err: any, result: any, fields: any) {
        if (err) throw err
        console.log(`data table created if not exists`)
    })
}