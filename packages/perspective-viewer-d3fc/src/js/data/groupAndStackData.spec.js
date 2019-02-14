import * as glob from "../globals/customElements";
import {groupAndStackData} from "../data/groupAndStackData";

glob.empty();

describe("groupAndStackData should", () => {
    test("include globals", () => {
        expect(typeof HTMLElement).toBe("function");

        expect(typeof customElements).toBe("object");

        expect(typeof customElements.define).toBe("function");
    });

    test("groupAndStackData should use settings data if no specific data is supplied", () => {
        const settings = {
            crossValues: [{name: "cross1", type: "string"}],
            data: [{value1: 10, __ROW_PATH__: ["CROSS1.1"]}, {value1: 20, __ROW_PATH__: ["CROSS1.2"]}, {value1: 30, __ROW_PATH__: ["CROSS1.1"]}],
            mainValues: [{name: "value1", type: "integer"}],
            splitValues: []
        };

        const groupedResult = groupAndStackData(settings);

        expect(groupedResult[0].length).toEqual(3);
    });

    test("groupAndStackData should use specific data if supplied", () => {
        const suppliedData = [{value1: 10, __ROW_PATH__: ["CROSS1.1"]}, {value1: 20, __ROW_PATH__: ["CROSS1.2"]}, {value1: 30, __ROW_PATH__: ["CROSS1.1"]}];

        const settings = {
            crossValues: [{name: "cross1", type: "string"}],
            data: suppliedData,
            mainValues: [{name: "value1", type: "integer"}],
            splitValues: []
        };

        suppliedData.push({value1: 40, __ROW_PATH__: ["CROSS1.3"]});

        const groupedResult = groupAndStackData(settings, suppliedData);

        expect(groupedResult[0].length).toEqual(4);
    });
});
