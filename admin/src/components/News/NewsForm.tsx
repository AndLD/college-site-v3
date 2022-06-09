import { DatePicker, Form, FormInstance, Input, Switch, Tooltip } from 'antd'
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import EditableTags from '../Users/EditableTags'

function NewsForm({ form }: { form: FormInstance }) {
    const actionModalVisibility = useSelector((state: any) => state.app.actionModalVisibility)
    const [tags, setTags] = useState<string[]>(form.getFieldValue('tags'))

    useEffect(() => {
        setTags(form.getFieldValue('tags'))
    }, [form.getFieldValue('tags')])

    useEffect(() => {
        if (!actionModalVisibility) {
            setTags([])
        }
    }, [actionModalVisibility])

    return (
        <Form form={form}>
            <Form.Item
                key={'title'}
                name="title"
                label="Title"
                rules={[
                    {
                        required: true,
                        message: 'Title is required'
                    }
                ]}
            >
                <Input />
            </Form.Item>

            <Form.Item key={'description'} name="description" label="Description">
                <Input />
            </Form.Item>

            <Form.Item key={'publicTimestamp'} name="publicTimestamp" label="Public Date">
                <DatePicker showTime />
            </Form.Item>

            <div key={'editableTags'} style={{ marginBottom: 20 }}>
                <EditableTags
                    tags={tags}
                    onSave={(newTags) => {
                        form.setFieldsValue({ tags: newTags })
                    }}
                    isNewTagBtnVisible={true}
                />
            </div>

            <Form.Item style={{ display: 'none' }} key={5} name="tags">
                <div></div>
            </Form.Item>

            <Form.Item key={'oldId'} name="oldId">
                <Input
                    min={1}
                    max={3000}
                    type="number"
                    placeholder="Old ID"
                    style={{ width: 100 }}
                />
            </Form.Item>
            <Form.Item
                label="Inline Main Image"
                key={'inlineMainImage'}
                name="inlineMainImage"
                valuePropName="checked"
            >
                <Switch style={{ marginLeft: 15, marginBottom: 2 }} />
            </Form.Item>
        </Form>
    )
}

export default NewsForm
