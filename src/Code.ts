interface StringKeyObject {
    [key: string]: any;
}

/**
 * This method is for instantiating SSQL. (= new SSQL(sheetId, sheetName))
 * @param {string} sheetId - This is the ID of the spreadsheet to use.
 * @param {string} sheetName - This is the sheet name of the spreadsheet to use. 
 * @return {SSQL}
 */
function open(sheetId: string, sheetName: string){
    const wm = new WeakMap();

    const privates = function(instance: any){
        return wm.get(instance) || wm.set(instance, {}).get(instance);
    }

    class SSQL {
        constructor(sheetId: string, sheetName: string){
            const self = privates(this);

            self.sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
            self.counter = 'row_'
            self.getKeys = getKeys.bind(this);
            self.getRows = getRows.bind(this);
            self.isMatch = isMatch.bind(this);


            const keys: string[] = self.getKeys();

            while(keys.includes(self.counter)){
                self.counter += '_';
            }
        }

        selectQ(keys: string[], where: string = ""){
            const self = privates(this);
            let rows: StringKeyObject[] = self.getRows();

            if(where.trim() !== ''){
                rows = rows.filter((row) => self.isMatch(row, where));
            }

            if(keys.includes('*')) {
                keys = self.getKeys();
            }
    
            const selectRows = rows.map((row) => {
                let obj: StringKeyObject = {};
    
                keys.forEach((key)=>{
                    if(Object.prototype.hasOwnProperty.call(row, key)){
                        obj[key] = row[key]
                    }
                });
    
                return obj;
            }) 
    
            return selectRows;
        }

        selectAs(keys: StringKeyObject, where: string = ""){
            const self = privates(this);
            let rows: StringKeyObject[] = self.getRows();

            if(where.trim() !== ''){
                rows = rows.filter((row) => self.isMatch(row, where));
            }

            let keys2: string[][] = [];

            for(let k in keys){
                if(k === "*"){
                    const ks: string[] = self.getKeys();

                    ks.forEach((v) => {
                        keys2.push([v, v]);
                    })
                } else {
                    keys2.push([k, keys[k]]);
                }
            }
    
            const selectRows = rows.map((row) => {
                let obj: StringKeyObject = {};
                
                keys2.forEach((v) => {
                    if(Object.prototype.hasOwnProperty.call(row, v[0])){
                        obj[v[1]] = row[v[0]]
                    }
                });
    
                return obj;
            }) 
    
            return selectRows;
        }

        insertQ(inserts: StringKeyObject[]): void {
            const self = privates(this);
            const keys = self.getKeys();
            const values = inserts.map((row)=>{
                let value = Array(keys.length)
    
                for(let key in row){
                    let column = keys.indexOf(key);
    
                    if(column !== -1){
                        value[column] = row[key]
                    }
                }
    
                return value;
            });

            self.sheet.getRange(self.sheet.getDataRange().getLastRow() + 1, 1, values.length, keys.length).setValues(values);
            return;
        }

        updateQ(updates: StringKeyObject, where: string): void {
            const self = privates(this);
            let updateRows: StringKeyObject[] = self.getRows();

            if(where.trim() !== ''){
                updateRows = updateRows.filter((row) => self.isMatch(row, where));
            }

            const keys: string[] = self.getKeys();

            updateRows.forEach((row) => {
                keys.forEach((key,i) => {
                    if(Object.prototype.hasOwnProperty.call(updates, key)){
                        self.sheet.getRange(row[self.counter], i + 1).setValue(updates[key]);
                    }                    
                });
            });
            return;
        }

        deleteQ(where: string): void {
            if(where.trim() === '') return;

            const self = privates(this);
            const allRows: StringKeyObject[] = self.getRows();
            const deleteRows = allRows.filter((row) => self.isMatch(row, where));
    
            if(deleteRows.length === 0) return;
    
            let deleteRowNumbers: number[] = [];
    
            deleteRows.forEach((row) => {
                deleteRowNumbers.push(row[self.counter]);
            });
    
            deleteRowNumbers = deleteRowNumbers.sort((a,b) => b-a);
            

            let rowPosition: number = 0;
            let howMany: number = 0;
            
            deleteRowNumbers.forEach((num,i) => {
                if(i === 0){
                    rowPosition = num;
                    howMany = 1;
                } else if((rowPosition-1) === num){
                    rowPosition = num;
                    howMany += 1;
                } else {
                    self.sheet.deleteRows(rowPosition, howMany);
                    rowPosition = num;
                    howMany = 1;
                }
    
                if(i === (deleteRowNumbers.length-1)){
                    self.sheet.deleteRows(rowPosition, howMany)
                }
            });
            return;
        }
    }

    function getKeys(): string[] {
        const self = privates(this);
        const values: [][] = self.sheet.getRange('1:1').getValues();
        const keys: string[] = values[0];

        return keys;
    }

    function getRows(): StringKeyObject[] {
        const self = privates(this);
        const values: [][] = self.sheet.getDataRange().getValues();
        const keys = values.splice(0,1)[0];
        const rows = values.map((value,i) => {
            let row: StringKeyObject = {};

            value.forEach((v,i) => {
                row[keys[i]] = v;
            });

            row[self.counter] = i + 2;

            return row;
        })

        return rows;
    }

    function isMatch(row: StringKeyObject, where: string): boolean {
        const toJudge = (value1: number | string | Boolean, op: string, value2: number | string | Boolean) => {
            if(op === '='){
                return value1 === value2;
            }else if(op === '>='){
                return value1 >= value2;
            }else if(op === '<='){
                return value1 <= value2;
            }else if(op === '<>'){
                return value1 !== value2;
            }else if(op === '>'){
                return value1 > value2;
            }else if(op === '<'){
                return value1 < value2;
            }else{
                return false;
            }           
        } 

        where = where.replace(/([\w]+|\[(?:(?!\[)[\s\S])*\])\s+(>=|<=|<>|>|<|=)\s+([0-9]+)/g, (match: string, name: string, op: string, value: string) => {
            if(name[0] === "["){
                name = name.slice(1,-1);
            }

            if(Object.prototype.hasOwnProperty.call(row, name)){
                return String(toJudge(row[name], op, Number(value)));
            } else {
                console.log(`The field name "${name}" was not found.('${match}')`);
                return match;
            }
        });

        where = where.replace(/(\w+|\[(?:(?!\[)[\s\S])*\])\s+(>=|<=|<>|>|<|=)\s+(true|false|True|False|TRUE|FALSE)/g, (match: string, name: string, op: string, value: string) => {
            if(name[0] === "["){
                name = name.slice(1,-1);
            }

            const bool = (value.match(/true/i) ? true : false);

            if(Object.prototype.hasOwnProperty.call(row, name)){
                return String(toJudge(row[name], op, bool));
            } else {
                console.log(`The field name "${name}" was not found.('${match}')`);
                return match;
            }
        });

        where = where.replace(/(\w+|\[(?:(?!\[)[\s\S])*\])\s+(>=|<=|<>|>|<|=)\s+(['"`])((?:(?!\3)[\s\S])*)\3/g, (match: string, name: string, op: string, _a, value: string) => {
            if(name[0] === "["){
                name = name.slice(1,-1);
            }

            if(Object.prototype.hasOwnProperty.call(row, name)){
                return String(toJudge(row[name], op, value));
            } else {
                console.log(`The field name "${name}" was not found.('${match}')`);
                return match;
            }
        });

        where = where.replace(/(\w+|\[(?:(?!\[)[\s\S])*\])\s+(>=|<=|<>|>|<|=)\s+date\s+(['"`])((?:(?!\3)[\s\S])*)\3/g, (match: string, name: string, op: string, _a, value: string) => {
            if(name[0] === "["){
                name = name.slice(1,-1);
            }

            const date = new Date(value)

            if(date.toString() === 'Invalid Date'){
                console.log(`This string "${value}" cannot be converted to date type.('${match}')`)
                return match;
            }

            const value1 = new Date(row[name]);

            if(value1.toString() === 'Invalid Date'){
                return "false";
            }            

            if(Object.prototype.hasOwnProperty.call(row, name)){
                return String(toJudge(value1.getTime(), op, date.getTime()));
            } else {
                console.log(`The field name "${name}" was not found.('${match}')`);
                return match;
            }
        });

        if(!where.match(/^(and|or|\s|true|false|\(|\))+$/i)){
            throw new Error(`There is a problem in the description of the where statement.('${where}')`);
        }

        where = where.replace(/(and|or)/gi, (match: string) => {
            if(match.toLowerCase() === 'and'){
                return '&&';
            } else if(match.toLowerCase() === 'or'){
                return '||';
            } else {
                return match;
            }
        });

        try {
            return Function("return (" + where + ")")();
        } catch(e){
            throw new Error(`There is a problem in the description of the where statement.('${where}')`);
        }
    }

    return new SSQL(sheetId, sheetName);
}

/**
 * This method selects data from a spreadsheet. (Similar to SQL select)
 * @param {string[]} keys - 'keys' is an array of field names. For example ['id', 'name', 'age'].
 * @param {string} where - 'where' is the extraction condition. For example "name = 'john' and age > 20".
 * @return {object[]}
 */
function selectQ(keys: string[], where: string): StringKeyObject[] {
    throw new Error('This is a class method. Call it from the SSQL class.')
}

/**
 * This method selects data from a spreadsheet. (Similar to SQL select) Change the field name to the specified one like the As clause and get it.
 * @param {StringKeyObject} keys - 'keys' is an array of field names. For example {"id": "id", "name": "hoge"}.
 * @param {string} where - 'where' is the extraction condition. For example "name = 'john' and age > 20".
 * @return {object[]}
 */
 function selectAs(keys: StringKeyObject, where: string): StringKeyObject[] {
    throw new Error('This is a class method. Call it from the SSQL class.')
}

/**
 * This method inserts data. (Similar to SQL insert)
 * @param {object[]} inserts - 'inserts' is the data to insert. For example {'name': 'john', 'age': 21}.
 */
function insertQ(inserts: StringKeyObject[]): void {
    throw new Error('This is a class method. Call it from the SSQL class.')
}

/**
 * This method updates data. (Similar to SQL update)
 * @param {object[]} updates - 'updates' is the data to update. For example {'age': 25}.
 * @param {string} where - 'where' is the extraction condition. For example "name = 'john' and age > 20".
 */
function updateQ(updates: StringKeyObject, where: string): void {
    throw new Error('This is a class method. Call it from the SSQL class.')
}

/**
 * This method deletes data. (Similar to SQL delete)
 * @param {string} where - 'where' is the extraction condition. For example "name = 'john' and age > 20".
 */
function deleteQ(where: string): void {
    throw new Error('This is a class method. Call it from the SSQL class.')
}