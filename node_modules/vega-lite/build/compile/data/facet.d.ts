import type { SignalRef } from 'vega';
import { FacetChannel } from '../../channel.js';
import type { EncodingFacetMapping, FacetFieldDef } from '../../spec/facet.js';
import { VgData } from '../../vega.schema.js';
import type { FacetModel } from '../facet.js';
import { Model } from '../model.js';
import { DataFlowNode } from './dataflow.js';
export declare function isCrossedFacetWithCustomSort(facet: Pick<EncodingFacetMapping<string, SignalRef>, 'row' | 'column'>): boolean;
export declare function facetLookupKeyFieldName(model: Model, channel: FacetChannel): string;
export declare function facetLookupKeyExpr(fieldDef: FacetFieldDef<string, SignalRef>, datum: 'datum' | 'datum.datum'): string;
/**
 * A node that helps us track what fields we are faceting by.
 */
export declare class FacetNode extends DataFlowNode {
    readonly model: FacetModel;
    readonly name: string;
    data: string;
    private readonly column;
    private readonly row;
    private readonly facet;
    private readonly childModel;
    /**
     * @param model The facet model.
     * @param name The name that this facet source will have.
     * @param data The source data for this facet data.
     */
    constructor(parent: DataFlowNode, model: FacetModel, name: string, data: string);
    hash(): string;
    get fields(): string[];
    /**
     * The sort index fields of the facet channels that are sorted by an array.
     */
    get sortIndexFields(): string[];
    get canMoveBelowAggregate(): boolean;
    dependentFields(): Set<string>;
    producedFields(): Set<string>;
    /**
     * The name to reference this source is its name.
     */
    getSource(): string;
    private getChildIndependentFieldsWithStep;
    private assembleRowColumnHeaderData;
    private assembleFacetHeaderData;
    private assembleFacetLookupDomainData;
    private assembleFacetSortLookupData;
    assemble(): VgData[];
}
//# sourceMappingURL=facet.d.ts.map