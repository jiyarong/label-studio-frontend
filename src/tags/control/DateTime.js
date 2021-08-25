import React from "react";
import { observer, inject } from "mobx-react";
import { types } from "mobx-state-tree";

import InfoModal from "../../components/Infomodal/Infomodal";
import { guidGenerator } from "../../core/Helpers";
import Registry from "../../core/Registry";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import PerRegionMixin from "../../mixins/PerRegion";
import RequiredMixin from "../../mixins/Required";
import { isDefined } from "../../utils/utilities";
import ControlBase from "./Base";

/**
 * DateTime adds date and time selection
 *
 * @example
 * <View>
 *   <Text name="txt" value="$text" />
 *   <DateTime name="datetime" toName="txt" />
 * </View>
 *
 * @name DateTime
 * @param {string} name                       - Name of the element
 * @param {string} toName                     - Name of the element that you want to label
 * @param {string} only                       - Comma-separated list of parts to display (day, month, year, date, time)
 * @param {string} [min]                      - Minimum datetime value
 * @param {string} [max]                      - Maximum datetime value
 * @param {number} [step=1]                   - Step for value increment/decrement
 * @param {string} [defaultValue]             - Default datetime value
 * @param {boolean} [required=false]          - Whether datetime is required or not
 * @param {string} [requiredMessage]          - Message to show if validation fails
 * @param {boolean} [perRegion]               - Use this tag to label regions instead of the whole object
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),

  only: types.maybeNull(types.string),
  min: types.maybeNull(types.string),
  max: types.maybeNull(types.string),
  step: types.maybeNull(types.string),
  defaultvalue: types.maybeNull(types.string),

  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model({
    pid: types.optional(types.string, guidGenerator),
    type: "datetime",
    date: types.maybeNull(types.string),
    time: types.maybeNull(types.string),
  })
  .views(self => ({
    selectedValues() {
      return self.datetime;
    },

    get holdsState() {
      return isDefined(self.date) || isDefined(self.time);
    },

    get datetime() {
      return (self.date || (new Date).toISOString().substr(0, 10)) + "T" + (self.time || "00:00");
    },

    get result() {
      if (self.perregion) {
        const area = self.annotation.highlightedNode;

        if (!area) return null;

        return self.annotation.results.find(r => r.from_name === self && r.area === area);
      }
      return self.annotation.results.find(r => r.from_name === self);
    },
  }))
  .actions(self => ({
    getSelectedString() {
      return self.datetime;
    },

    copyState(obj) {
      self.setDateTime(obj.datetime);
    },

    needsUpdate() {
      if (self.result) {
        self.setDateTime(self.result.mainValue);
      } else {
        self.date = null;
        self.time = null;
      }
    },

    unselectAll() {},

    setDateTime(value) {
      const [date, time] = value.split(/T| /);

      self.date = date;
      self.time = time;
    },

    updateResult() {
      if (self.result) {
        self.result.area.setValue(self);
      } else {
        if (self.perregion) {
          const area = self.annotation.highlightedNode;

          if (!area) return null;
          area.setValue(self);
        } else {
          self.annotation.createResult({}, { datetime: self.datetime }, self, self.toname);
        }
      }
    },

    onDateChange(e) {
      self.date = e.target.value;
      self.updateResult();
    },
    
    onTimeChange(e) {
      self.time = e.target.value;
      self.updateResult();
    },

    updateFromResult() {
      this.needsUpdate();
    },

    requiredModal() {
      InfoModal.warning(self.requiredmessage || `DateTime "${self.name}" is required.`);
    },
  }));

const DateTimeModel = types.compose("DateTimeModel", ControlBase, TagAttrs, Model, RequiredMixin, PerRegionMixin, AnnotationMixin);

const HtxDateTime = inject("store")(
  observer(({ item }) => {
    const visibleStyle = item.perRegionVisible() ? {} : { display: "none" };

    return (
      <div style={visibleStyle}>
        <input
          type="date"
          name={item.name + "-date"}
          value={item.date}
          // step={item.step ?? 1}
          // min={isDefined(item.min) ? Number(item.min) : undefined}
          // max={isDefined(item.max) ? Number(item.max) : undefined}
          // defaultValue={Number(item.defaultvalue)}
          onChange={item.onDateChange}
        />
        <input type="time" name={item.name + "-time"} value={item.time} onChange={item.onTimeChange}/>
      </div>
    );
  }),
);

Registry.addTag("datetime", DateTimeModel, HtxDateTime);

export { HtxDateTime, DateTimeModel };
