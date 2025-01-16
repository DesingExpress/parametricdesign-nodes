## Nodes Structure

```bash
 ParametricDesign
 ├── Basic
 │   └── Point
 ├── 2D
 │   └── Draw
 └── 3D
     └── Model

```

## 🔲Include Nodes

### `genPoint` Node

```litegraph
{
  "title": "genPoint",
  "outputs": [
    { "label": "pointData", "type":"parametric-design::pointData" },
  ]
}
```

#### Slots

##### Outputs

| Label         | Type     | Description |
| ------------- | -------- | ----------- |
| **pointData** | `object` |             |

---

&nbsp;
&nbsp;

### `genDraw` Node

```litegraph
{
  "title": "genDarw",
  "inputs": [
    { "label": "pointData", "type":"parametric-design::pointData" }
    ],
  "outputs": [
    { "label": "draws", "type":"array" }
  ]
}
```

#### Slots

##### Inputs

| Label         | Type                           | Description |
| ------------- | ------------------------------ | ----------- |
| **pointData** | `parametric-design::pointData` |             |

##### Outputs

| Label     | Type    | Description |
| --------- | ------- | ----------- |
| **draws** | `array` |             |

---

&nbsp;
&nbsp;

### `genModel` Node

```litegraph
{
  "title": "SaveFilePicker",
  "inputs": [
    { "label": "pointData", "type":"parametric-design::pointData" }
    ],
  "outputs": [
    { "label": "models", "type":"array" }
  ]
}
```

#### Slots

##### Inputs

| Label         | Type                           | Description |
| ------------- | ------------------------------ | ----------- |
| **pointData** | `parametric-design::pointData` |             |

##### Outputs

| Label      | Type    | Description |
| ---------- | ------- | ----------- |
| **models** | `array` |             |

---

&nbsp;
&nbsp;

## Loadmap

## Contributing

Please visit [Github repository [ Nexivil-Inc/parametricdesign-nodes ]](https://github.com/Nexivil-Inc/parametricdesign-nodes)

## Sources

[Github repository [ Nexivil-Inc/parametricdesign-nodes ]](https://github.com/DesingExpress/file-system-Nodes)

## License

[MIT](https://mit-license.org/)
