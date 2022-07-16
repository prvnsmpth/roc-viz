import * as Plot from '@observablehq/plot'

export type Label = 'positive' | 'negative'
export interface DataPoint {
  label: Label
  score: number
}

export function makePlot(data: DataPoint[], threshold: number) {
  return Plot.plot({
    height: 400,
    width: 1000,
    y: {
      label: 'No. of examples',
      grid: true,
    },
    x: {
      label: 'score',
      domain: [-0.25, 1.25],
    },
    color: {
      legend: true,
    },
    marks: [
      Plot.areaY(
        data,
        Plot.binX({ y2: 'count' }, { x: 'score', fill: 'label', curve: 'natural', mixBlendMode: 'multiply' })
      ),
      Plot.areaY(
        data,
        Plot.binX({ y2: 'count' }, { x: 'score', fill: 'label', curve: 'natural', mixBlendMode: 'multiply' })
      ),
      Plot.ruleY([0]),
      Plot.ruleX([threshold], { strokeWidth: 4 }),
    ],
  })
}

export function makeRocPlot(data: DataPoint[], roc: Array<[number, number]>, threshold: number) {
  const [tp, fn, fp, tn] = computeConfusionMatrix(data, threshold)
  const fpr = fp / (fp + tn)
  const tpr = tp / (tp + fn)
  const pt = [{ fpr, tpr }]
  return Plot.plot({
    height: 400,
    width: 700,
    y: {
      label: 'True Positive Rate',
      grid: true,
      domain: [0, 1],
    },
    x: {
      label: 'False Positive Rate',
      grid: true,
      domain: [0, 1],
    },
    marks: [
      Plot.line(roc, { strokeWidth: 2 }),
      Plot.dot(pt, { x: 'fpr', y: 'tpr', stroke: 'red', fill: 'red', r: 5 }),
      Plot.line(
        [
          [0, 0],
          [1, 1],
        ],
        { stroke: 'blue', opacity: 0.2 }
      ),
    ],
  })
}

export function makePrPlot(data: DataPoint[], pr: Array<[number, number]>, threshold: number) {
  const [tp, fn, fp, tn] = computeConfusionMatrix(data, threshold)
  const p = tp + fp > 0 ? tp / (tp + fp) : 0.0
  const r = tp / (tp + fn)
  const pt = [{ p, r }]
  return Plot.plot({
    height: 400,
    width: 700,
    y: {
      label: 'Precision',
      grid: true,
      domain: [0, 1],
    },
    x: {
      label: 'Recall',
      grid: true,
      domain: [0, 1],
    },
    marks: [
      Plot.line(pr, { strokeWidth: 2 }),
      Plot.dot(pt, { x: 'r', y: 'p', stroke: 'red', fill: 'red', r: 5 }),
      Plot.line(
        [
          [0, 1],
          [1, 0],
        ],
        { stroke: 'blue', opacity: 0.2 }
      ),
    ],
  })
}

export function renderPlot(elementId, plot) {
  const chartEl = document.getElementById(elementId)
  chartEl.replaceChildren(plot)
}

export function computeNumExamples(totalExamples: number, skewTowards: Label, skew: number) {
  let numPositives, numNegatives
  if (skewTowards === 'positive') {
    numPositives = totalExamples / (1 + skew)
    numNegatives = totalExamples - numPositives
  } else {
    numNegatives = totalExamples / (1 + skew)
    numPositives = totalExamples - numNegatives
  }
  return [numPositives, numNegatives]
}

export function computeConfusionMatrix(data: DataPoint[], threshold: number) {
  let tp = 0,
    tn = 0,
    fp = 0,
    fn = 0
  for (const pt of data) {
    if (pt.label === 'positive') {
      if (pt.score >= threshold) {
        tp++
      } else {
        fn++
      }
    } else {
      if (pt.score >= threshold) {
        fp++
      } else {
        tn++
      }
    }
  }
  return [tp, fn, fp, tn]
}

export function computeRocCurve(data: DataPoint[]): Array<[number, number]> {
  let res: Array<[number, number]> = []

  const addPt = (threshold: number) => {
    let [tp, fn, fp, tn] = computeConfusionMatrix(data, threshold)
    let fpr = fp / (fp + tn)
    let tpr = tp / (tp + fn)
    res.push([fpr, tpr])
    return [fpr, tpr]
  }

  let [fpr, tpr] = addPt(1.0)
  let prevFpr = fpr,
    prevTpr = tpr
  let auc = 0.0
  for (let i = 1.0; i >= 0.0; i -= 0.01) {
    ;[fpr, tpr] = addPt(i)
    auc += Math.abs(fpr - prevFpr) * prevTpr
    prevFpr = fpr
    prevTpr = tpr
  }

  return res
}

export function computePrCurve(data: DataPoint[]) {
  let res: Array<[number, number]> = []

  const addPt = (threshold: number) => {
    let [tp, fn, fp, tn] = computeConfusionMatrix(data, threshold)
    let p = fp + tp > 0 ? tp / (fp + tp) : 0.0
    let r = tp / (tp + fn)
    res.push([r, p])
    return [r, p]
  }

  for (let i = 1.0; i >= 0.0; i -= 0.01) {
    addPt(i)
  }

  return res
}

export function computePrecision(cm: number[]) {
  const [tp, fn, fp, tn] = cm
  return (fp + tp > 0 ? tp / (tp + fp) : 0.0).toFixed(2)
}

export function computeRecall(cm: number[]) {
  const [tp, fn, fp, tn] = cm
  return (tp / (tp + fn)).toFixed(2)
}
