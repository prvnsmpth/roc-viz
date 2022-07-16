<script lang="ts">
  import * as Plot from '@observablehq/plot'
  import * as d3 from 'd3'
  import { afterUpdate } from 'svelte'
  import {
    makePlot,
    renderPlot,
    computeNumExamples,
    computeConfusionMatrix,
    computeRocCurve,
    makeRocPlot,
    makePrPlot,
    computePrCurve,
    computePrecision,
    computeRecall,
  } from './app'
  import type { Label, DataPoint } from './app'

  let sigma = 0.1
  let xdiff = 0.1
  let skew = 1
  let skewTowards: Label = 'positive'
  let threshold = 0.5

  const totalExamples = 10000

  $: [numPositives, numNegatives] = computeNumExamples(totalExamples, skewTowards, skew)

  $: positives = Array.from({ length: numPositives }, d3.randomNormal(0.5 - xdiff, sigma)).map((i: number) => ({
    label: 'negative' as Label,
    score: i,
  }))
  $: negatives = Array.from({ length: numNegatives }, d3.randomNormal(0.5 + xdiff, sigma)).map((i: number) => ({
    label: 'positive' as Label,
    score: i,
  }))
  $: data = [...positives, ...negatives].sort((a, b) => a.score - b.score)
  $: plot = makePlot(data, threshold)
  $: cm = computeConfusionMatrix(data, threshold)
  $: precision = computePrecision(cm)
  $: recall = computeRecall(cm)

  // ROC curve
  $: roc = computeRocCurve(data)
  $: rocPlot = makeRocPlot(data, roc, threshold)

  // PR curve
  $: prCurve = computePrCurve(data)
  $: prPlot = makePrPlot(data, prCurve, threshold)

  afterUpdate(() => {
    renderPlot('score-distribution', plot)
    renderPlot('roc', rocPlot)
    renderPlot('pr', prPlot)
  })
</script>

<main>
  <div class="flex-container">
    <fieldset>
      <legend>Data controls</legend>
      <br />
      <div>
        Skew towards
        <label>
          <input name="skewTowards" type="radio" bind:group={skewTowards} value="positive" />
          Positives
        </label>
        <label>
          <input name="skewTowards" type="radio" bind:group={skewTowards} value="negative" />
          Negatives
        </label>
      </div>
      <br />
      <label for="skew">Skew (current value: {skew}x)</label>
      <input name="skew" type="range" min="1" max="10" step="1" bind:value={skew} />
    </fieldset>
    <fieldset>
      <legend>Model Controls</legend>
      <br />
      <label for="xdiff">Model effectiveness</label>
      <input name="xdiff" type="range" min="0" max="0.35" step="0.01" bind:value={xdiff} />
      <label for="threshold">Threshold (current value: {threshold})</label>
      <input name="threshold" type="range" min="0" max="1.0" step="0.01" bind:value={threshold} />
    </fieldset>
    <table>
      <caption>Confusion Matrix</caption>
      <tr>
        <th />
        <th>Predicted positive</th>
        <th>Predicted negative</th>
      </tr>
      <tr>
        <th>Actual positive</th>
        <td>{cm[0]}</td>
        <td>{cm[1]}</td>
      </tr>
      <tr>
        <th>Actual negative</th>
        <td>{cm[2]}</td>
        <td>{cm[3]}</td>
      </tr>
      <tfoot>
        <tr>
          <td colspan="3">P = {precision}, R = {recall}</td>
        </tr>
        </tfoot>
    </table>
  </div>
  <div class="flex-container chart-container">
    <div id="score-distribution" />
    <div id="roc" />
    <div id="pr" />
  </div>
</main>

<style>
  main {
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  .flex-container {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
  }

  .flex-container > * {
    margin-left: 50px;
  }

  .chart-container > * {
    margin: 50px 10px;
    min-width: 400px;
  }

  fieldset {
    width: 400px;
  }

  table {
    min-width: 500px;
    border-collapse: collapse;
  }

  table td,
  table th {
    border: 1px solid black;
    padding: 5px;
  }

  th {
    background-color: lightgray;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
