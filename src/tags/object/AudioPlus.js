import React, { Fragment } from "react";
import { inject, observer } from "mobx-react";
import { getRoot, getType, types } from "mobx-state-tree";

import AudioControls from "./Audio/Controls";
import ObjectTag from "../../components/Tags/Object";
import ObjectBase from "./Base";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import Registry from "../../core/Registry";
import Utils from "../../utils";
import Waveform from "../../components/Waveform/Waveform";
import { AudioRegionModel } from "../../regions/AudioRegion";
import { guidGenerator, restoreNewsnapshot } from "../../core/Helpers";
import { ErrorMessage } from "../../components/ErrorMessage/ErrorMessage";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import { SyncMixin } from "../../mixins/SyncMixin";
import { useRef } from "react";
import { useEffect } from "react";
import { isDefined } from "../../utils/utilities";

/**
 * The AudioPlus tag plays audio and shows its waveform. Use for audio annotation tasks where you want to label regions of audio, see the waveform, and manipulate audio during annotation.
 *
 * Use with the following data types: audio
 * @example
 * <!--Labeling configuration to label regions of audio and rate the audio sample-->
 * <View>
 *   <Labels name="lbl-1" toName="audio-1">
 *     <Label value="Guitar" />
 *     <Label value="Drums" />
 *   </Labels>
 *   <Rating name="rate-1" toName="audio-1" />
 *   <AudioPlus name="audio-1" value="$audio" />
 * </View>
 * @name AudioPlus
 * @meta_title AudioPlus Tag for Audio Labeling
 * @meta_description Customize Label Studio with the AudioPlus tag for advanced audio annotation tasks for machine learning and data science projects.
 * @param {string} name - Name of the element
 * @param {string} value - Data field containing path or a URL to the audio
 * @param {boolean=} [volume=false] - Whether to show a volume slider (from 0 to 1)
 * @param {boolean} [speed=false] - Whether to show a speed slider (from 0.5 to 3)
 * @param {boolean} [zoom=true] - Whether to show the zoom slider
 * @param {string} [hotkey] - Hotkey used to play or pause audio
 * @param {string} [sync] object name to sync with
 */
const TagAttrs = types.model({
  name: types.identifier,
  value: types.maybeNull(types.string),
  zoom: types.optional(types.boolean, true),
  volume: types.optional(types.boolean, true),
  speed: types.optional(types.boolean, true),
  hotkey: types.maybeNull(types.string),
  showlabels: types.optional(types.boolean, false),
  showscores: types.optional(types.boolean, false),
  height: types.optional(types.string, "128"),
});

const Model = types
  .model("AudioPlusModel", {
    type: "audio",
    _value: types.optional(types.string, ""),

    playing: types.optional(types.boolean, false),
    regions: types.array(AudioRegionModel),
  })
  .volatile(() => ({
    errors: [],
  }))
  .views(self => ({
    get hasStates() {
      const states = self.states();

      return states && states.length > 0;
    },

    get store() {
      return getRoot(self);
    },

    get regs() {
      return self.annotation?.regionStore.regions.filter(r => r.object === self) || [];
    },

    states() {
      return self.annotation.toNames.get(self.name);
    },

    activeStates() {
      const states = self.states();

      return states && states.filter(s => getType(s).name === "LabelsModel" && s.isSelected);
    },
  }))
  .actions(self => ({
    needsUpdate() {
      self.handleNewRegions();

      if (self.sync) self.initSync();
    },

    handleSyncPlay() {
      self._ws?.play();
    },

    handleSyncPause() {
      self._ws?.pause();
    },

    handleSyncSeek(time) {
      self._ws && (self._ws.setCurrentTime(time));
    },

    handleNewRegions() {
      if (!self._ws) return;
      self.regs.map(reg => {
        if (reg._ws_region) return;
        self.createWsRegion(reg);
      });
    },

    onHotKey(e) {
      e && e.preventDefault();
      self._ws.playPause();
      return false;
    },

    fromStateJSON(obj, fromModel) {
      let r;
      let m;

      const fm = self.annotation.names.get(obj.from_name);

      fm.fromStateJSON(obj);

      if (!fm.perregion && fromModel.type !== "labels") return;

      /**
       *
       */
      const tree = {
        pid: obj.id,
        start: obj.value.start,
        end: obj.value.end,
        normalization: obj.normalization,
        score: obj.score,
        readonly: obj.readonly,
      };

      r = self.findRegion({ start: obj.value.start, end: obj.value.end });

      if (fromModel) {
        m = restoreNewsnapshot(fromModel);
        // m.fromStateJSON(obj);

        if (!r) {
          // tree.states = [m];
          r = self.createRegion(tree, [m]);
          // r = self.addRegion(tree);
        } else {
          r.states.push(m);
        }
      }

      if (self._ws) {
        self._ws.addRegion({
          start: r.start,
          end: r.end,
        });
      }

      // if (fm.perregion)
      //     fm.perRegionCleanup();

      r.updateAppearenceFromState();

      return r;
    },

    setRangeValue(val) {
      self.rangeValue = val;
    },

    setPlaybackRate(val) {
      self.playBackRate = val;
    },

    createRegion(wsRegion, states) {
      let bgColor = self.selectedregionbg;
      const st = states.find(s => s.type === "labels");

      if (st) bgColor = Utils.Colors.convertToRGBA(st.getSelectedColor(), 0.3);

      const r = AudioRegionModel.create({
        id: wsRegion.id ? wsRegion.id : guidGenerator(),
        pid: wsRegion.pid ? wsRegion.pid : guidGenerator(),
        parentID: wsRegion.parent_id === null ? "" : wsRegion.parent_id,
        start: wsRegion.start,
        end: wsRegion.end,
        score: wsRegion.score,
        readonly: wsRegion.readonly,
        regionbg: self.regionbg,
        selectedregionbg: bgColor,
        normalization: wsRegion.normalization,
        states,
      });

      r._ws_region = wsRegion;

      self.regions.push(r);
      self.annotation.addRegion(r);

      return r;
    },

    selectRange(ev, ws_region) {
      const selectedRegions = self.regs.filter(r=>r.start >= ws_region.start && r.end <= ws_region.end);

      ws_region.remove && ws_region.remove();
      if (!selectedRegions.length) return;
      // @todo: needs preventing drawing with ctrl pressed
      // if (ev.ctrlKey || ev.metaKey) {
      //   self.annotation.extendSelectionWith(selectedRegions);
      //   return;
      // }
      self.annotation.selectAreas(selectedRegions);
    },

    addRegion(ws_region) {
      // area id is assigned to WS region during deserealization
      const find_r = self.annotation.areas.get(ws_region.id);

      if (find_r) {
        find_r.applyCSSClass(ws_region);

        find_r._ws_region = ws_region;
        return find_r;
      }

      const states = self.getAvailableStates();

      if (states.length === 0) {
        ws_region.on("update-end", ev=>self.selectRange(ev,ws_region));
        return;
      }

      const control = self.activeStates()[0];
      const labels = { [control.valueType]: control.selectedValues() };
      const r = self.annotation.createResult(ws_region, labels, control, self);

      r._ws_region = ws_region;
      r.updateAppearenceFromState();
      return r;
    },

    /**
     * Play and stop
     */
    handlePlay() {
      self.playing = !self.playing;
      self._ws.isPlaying() ? self.triggerSyncPlay() : self.triggerSyncPause();
    },

    handleSeek() {
      self.triggerSyncSeek(self._ws.getCurrentTime());
    },

    createWsRegion(region) {
      const r = self._ws.addRegion(region.wsRegionOptions);

      region._ws_region = r;
      region.updateAppearenceFromState();
    },

    onLoad(ws) {
      self._ws = ws;

      self.regs.forEach(reg => {
        self.createWsRegion(reg);
      });
    },

    onError(error) {
      self.errors = [error];
    },

    wsCreated(ws) {
      self._ws = ws;
    },

    beforeDestroy() {
      if (isDefined(self._ws)) {
        self._ws.destroy();
        self._ws = null;
      }
    },
  }));

const AudioPlusModel = types.compose("AudioPlusModel", TagAttrs, SyncMixin, ProcessAttrsMixin, ObjectBase, AnnotationMixin, Model);

const HtxAudioView = ({ store, item }) => {
  if (!item._value) return null;

  return (
    <ObjectTag item={item}>
      <Fragment>
        {item.errors?.map((error, i) => (
          <ErrorMessage key={`err-${i}`} error={error} />
        ))}
        <Waveform
          dataField={item.value}
          src={item._value}
          selectRegion={item.selectRegion}
          handlePlay={item.handlePlay}
          handleSeek={item.handleSeek}
          onCreate={item.wsCreated}
          addRegion={item.addRegion}
          onLoad={item.onLoad}
          onError={item.onError}
          speed={item.speed}
          zoom={item.zoom}
          volume={item.volume}
          regions={true}
          height={item.height}
        />

        <AudioControls item={item} store={store} />
        <div style={{ marginBottom: "4px" }}></div>
      </Fragment>
    </ObjectTag>
  );
};

const HtxAudioPlus = inject("store")(observer(HtxAudioView));

Registry.addTag("audioplus", AudioPlusModel, HtxAudioPlus);
Registry.addObjectType(AudioPlusModel);

export { AudioRegionModel, AudioPlusModel, HtxAudioPlus };
