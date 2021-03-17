import { FormTypes } from '@oneblink/types'
import { v4 as uuid } from 'uuid'

import { validateWithElementSchema } from './forms-validation'

export default function generateFormElement<
  T extends FormTypes._FormElementBase
>(formElementGenerationData?: Record<string, unknown>): T {
  if (!formElementGenerationData) {
    throw new Error(
      'no form element generation data provided, please provide this data to generate a form element',
    )
  }

  // initialise empty element object and spread data passed by user
  const formElement: Record<string, unknown> = { ...formElementGenerationData }

  // element property: id
  if (typeof formElementGenerationData.id === 'string') {
    formElement.id = formElementGenerationData.id
  } else {
    formElement.id = uuid()
  }

  // element property: options
  if (Array.isArray(formElementGenerationData.options)) {
    const options = formElementGenerationData.options.map((o, index) => {
      const option = o || {}
      return {
        ...option,
        id: uuid(),
        label: option.label || option.value || `Option ${index + 1}`,
        value: option.value || index.toString(),
      }
    })
    formElement.options = options
  }

  // element property: type || default to: 'text'
  if (typeof formElementGenerationData.type === 'string') {
    formElement.type = formElementGenerationData.type
  } else {
    formElement.type = 'text'
  }

  // element property: required || default to: false
  if (typeof formElementGenerationData.required === 'boolean') {
    formElement.required = formElementGenerationData.required
  } else {
    formElement.required = false
  }

  // element property: label || default to: {type}
  let label = ''
  if (typeof formElementGenerationData.label === 'string') {
    label = formElementGenerationData.label
  } else if (typeof formElement.type === 'string') {
    label = formElement.type
  }

  // element property: name || default to: {label(without spaces)}
  if (typeof formElementGenerationData.name !== 'string') {
    formElement.name = label.replace(/\s+/g, '_')
  }
  formElement.label = label

  // element property: conditionallyShow || default: false
  if (typeof formElementGenerationData.conditionallyShow === 'boolean') {
    formElement.conditionallyShow = formElementGenerationData.conditionallyShow
  } else {
    formElement.conditionallyShow = false
  }

  // element property: readOnly || default: false
  formElement.readOnly = formElementGenerationData.readOnly || false

  const validatedFormElement = validateWithElementSchema<T>(formElement)
  return validatedFormElement
}
