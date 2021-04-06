# OneBlink SDK | Form Element Definitions

[Back to all Elements](./README.md)

## Datetime Element

Allow the user to select a date and time. Submission data will be in [ISO_8601 Timestamp](https://en.wikipedia.org/wiki/ISO_8601) format.

| Property           | Required | Type      | Default      | Description                                                                                                                                          |
| ------------------ | -------- | --------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`             | Yes      | `string`  | `'datetime'` | The type of Form Element.                                                                                                                            |
| `name`             | Yes      | `string`  |              | The key that will be assigned a value in the submission data when the form is submitted.                                                             |
| `label`            | Yes      | `string`  |              | Display text presented to the user above the input by default.                                                                                       |
| `hint`             | No       | `string`  |              | A hint triggered by an icon tooltip to be displayed when hovering beside the element label.                                                          |
| `defaultValue`     | No       | `string`  |              | A default value when the form is opened.                                                                                                             |
| `placeholderValue` | No       | `string`  |              | The content to appear in the form control when the form control is empty.                                                                            |
| `required`         | Yes      | `boolean` | `false`      | Determine if this input requires a date and time selected by the user (`true`) or not (`false`).                                                     |
| `readOnly`         | Yes      | `boolean` | `false`      | Determine if this input can be edited by the user (`false`) or not (`true`).                                                                         |
| `fromDate`         | No       | `string`  |              | The earliest possible date and time that can be selected by the user. Must be in [ISO_8601 Timestamp](https://en.wikipedia.org/wiki/ISO_8601) format |
| `toDate`           | No       | `string`  |              | The latest possible date and time that can be selected by the user. Must be in [ISO_8601 Timestamp](https://en.wikipedia.org/wiki/ISO_8601) format   |

Datetime element also inherits the properties of the following:

- [Base Element](./base-element.md)
- [Lookup Element](./lookup-element.md)

### Example

```JSON
{
  "id": "b1311ae0-6bb7-11e9-a923-1681be663d3e",
  "type": "datetime",
  "name": "when",
  "label": "When did it occur?",
  "required": true,
  "readOnly": false
}
```
