import External from "../core/External";
import Messages from "../utils/messages";

/**
 * Text
 */
import { DialogueAnalysis } from "../examples/dialogue_analysis"; // eslint-disable-line no-unused-vars
import { NamedEntity } from "../examples/named_entity"; // eslint-disable-line no-unused-vars
import { References } from "../examples/references"; // eslint-disable-line no-unused-vars
import { Required } from "../examples/required"; // eslint-disable-line no-unused-vars
import { Sentiment } from "../examples/sentiment_analysis"; // eslint-disable-line no-unused-vars
import { Nested as NestedSimple } from "../examples/nested_choices"; // eslint-disable-line no-unused-vars
import { Nested } from "../examples/nested_choices/complicated"; // eslint-disable-line no-unused-vars
import { Dialogue } from "../examples/phrases"; // eslint-disable-line no-unused-vars

/**
 * Audio
 */
import { AudioClassification } from "../examples/audio_classification"; // eslint-disable-line no-unused-vars
import { AudioRegions } from "../examples/audio_regions"; // eslint-disable-line no-unused-vars
import { TranscribeAudio } from "../examples/transcribe_audio"; // eslint-disable-line no-unused-vars
import { MyExample } from "../examples/my_example"; // eslint-disable-line no-unused-vars

/**
 * Image
 */
import { ImageBbox } from "../examples/image_bbox"; // eslint-disable-line no-unused-vars
import { ImageKeyPoint } from "../examples/image_keypoints"; // eslint-disable-line no-unused-vars
import { ImageMultilabel } from "../examples/image_multilabel"; // eslint-disable-line no-unused-vars
import { ImageEllipselabels } from "../examples/image_ellipses"; // eslint-disable-line no-unused-vars
import { ImagePolygons } from "../examples/image_polygons"; // eslint-disable-line no-unused-vars
import { ImageSegmentation } from "../examples/image_segmentation"; // eslint-disable-line no-unused-vars

/**
 * HTML
 */
import { HTMLDocument } from "../examples/html_document"; // eslint-disable-line no-unused-vars
import { Taxonomy } from "../examples/taxonomy"; // eslint-disable-line no-unused-vars

/**
 * Different
 */
import { Pairwise } from "../examples/pairwise"; // eslint-disable-line no-unused-vars

import { TimeSeries } from "../examples/timeseries"; // eslint-disable-line no-unused-vars

/**
 * Custom Data
 */
// import { AllTypes } from "../examples/all_types"; // eslint-disable-line no-unused-vars

const data = MyExample;
// const data = {
//   config: `<View>
//     <HyperText name="video" value="$videoDom"/>
//       <Labels name="label" toName="audio" choice="multiple">
//       <Label value='是否表达流畅01(3598)(0)' background='#88ffee'>是否表达流畅01(3598)(0)</Label>
//       <Label value='是否表达流畅02(3599)(0)' background='#ffd6a9'>是否表达流畅02(3599)(0)</Label>
//       <Label value='音视频标注(3605)(0)' background='#ff8f8f'>音视频标注(3605)(0)</Label>
//       <Label value='音视频标注1(3606)(0)' background='#c5c5ff'>音视频标注1(3606)(0)</Label>
//       <Label value='音视频标注2(3607)(0)' background='#8af9c3'>音视频标注2(3607)(0)</Label>
//       <Label value='音视频标注3(3608)(0)' background='#7ca2f7'>音视频标注3(3608)(0)</Label>
//       <Label value='音视频标注4(3609)(0)' background='#ffb3f4'>音视频标注4(3609)(0)</Label>
//       <Label value='音视频标注5(3610)(0)' background='#ffec9c'>音视频标注5(3610)(0)</Label>
//       </Labels>
//     <AudioPlus name="audio" value="$videoUrl" speed="false"/>
// </View>`,
//   interfaces: ['side-column', 'controls', 'update', 'submit'],
//   task: [{
//     data: "{\"videoDom\":\"<video src=https://annotator-test-1256119856.cos.ap-shanghai.myqcloud.com/779896058332094464_zhihu2018_hd_2.mp4?sign=q-sign-algorithm%3Dsha1%26q-ak%3DAKIDFYaQAeIgJfk25Zl7JK5aFeZMNAi16oJY%26q-sign-time%3D1643010158%3B1643013758%26q-key-time%3D1643010158%3B1643013758%26q-header-list%3D%26q-url-param-list%3D%26q-signature%3D34358f468de9fef69adf34e529e511b9bf04c814 width=100% muted /><img src onerror=\\\"$=n=>document.getElementsByTagName(n)[0];a=$('audio');v=$('video');a.onseeked=()=>{v.currentTime=a.currentTime};a.onplay=(e)=>{v.play()};a.onpause=()=>v.pause()\\\" />\",\"videoUrl\":\"https://annotator-test-1256119856.cos.ap-shanghai.myqcloud.com/779896058332094464_zhihu2018_hd_2.mp4?sign=q-sign-algorithm%3Dsha1%26q-ak%3DAKIDFYaQAeIgJfk25Zl7JK5aFeZMNAi16oJY%26q-sign-time%3D1643010158%3B1643013758%26q-key-time%3D1643010158%3B1643013758%26q-header-list%3D%26q-url-param-list%3D%26q-signature%3D34358f468de9fef69adf34e529e511b9bf04c814\"}"
//   }],
//   // annotations: [{result: Array(0), type: 'annotation'}],
//   user: {pk: 1, firstName: 'James', lastName: 'Dean'}
// };

/**
 * Get current config
 * @param {string} pathToConfig
 */
async function getConfig(pathToConfig) {
  const response = await fetch(pathToConfig);
  const config = await response.text();
  return config;
}

/**
 * Get custom config
 */
async function getExample() {
  let datatype = data;

  let config = await getConfig(datatype.config);
  let task = {
    data: JSON.stringify(datatype.tasks[0].data),
  };
  let annotations = datatype.annotation.annotations;
  let predictions = datatype.tasks[0].predictions;

  return { config, task, annotations, predictions };
}

/**
 * Function to return App element
 */
function rootElement(element) {
  const el = document.createElement("div");

  let root;

  if (typeof element === "string") {
    root = document.getElementById(element);
  } else {
    root = element;
  }

  root.innerHTML = "";
  root.appendChild(el);

  root.style.width = "auto";

  return el;
}

/**
 * Function to configure application with callbacks
 * @param {object} params
 */
function configureApplication(params) {
  const options = {
    alert: m => console.log(m), // Noop for demo: window.alert(m)
    messages: { ...Messages, ...params.messages },
    onSubmitAnnotation: params.onSubmitAnnotation ? params.onSubmitAnnotation : External.onSubmitAnnotation,
    onUpdateAnnotation: params.onUpdateAnnotation ? params.onUpdateAnnotation : External.onUpdateAnnotation,
    onDeleteAnnotation: params.onDeleteAnnotation ? params.onDeleteAnnotation : External.onDeleteAnnotation,
    onSkipTask: params.onSkipTask ? params.onSkipTask : External.onSkipTask,
    onSubmitDraft: params.onSubmitDraft || External.onSubmitDraft,
    onTaskLoad: params.onTaskLoad ? params.onTaskLoad : External.onTaskLoad,
    onLabelStudioLoad: params.onLabelStudioLoad ? params.onLabelStudioLoad : External.onLabelStudioLoad,
    onEntityCreate: params.onEntityCreate || External.onEntityCreate,
    onEntityDelete: params.onEntityDelete || External.onEntityDelete,
    onGroundTruth: params.onGroundTruth || External.onGroundTruth,
    onSelectAnnotation: params.onSelectAnnotation || External.onSelectAnnotation,
  };

  return options;
}

export default { rootElement, getExample, configureApplication };
