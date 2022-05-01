import { Checkbox, DatePicker, Form, FormInstance, Input } from 'antd'
import { useEffect, useState } from 'react'
import EditableTags from '../Users/EditableTags'

function ArticleForm({ form }: { form: FormInstance }) {
    const [tags, setTags] = useState<string[]>([])

    useEffect(() => {
        form.setFieldsValue({ tags })
    }, [tags])

    const articleFormItems = [
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
        </Form.Item>,
        <Form.Item key={'description'} name="description" label="Description">
            <Input />
        </Form.Item>,
        <Form.Item key={'publicTimestamp'} name="publicTimestamp" label="Public Date">
            <DatePicker showTime />
        </Form.Item>,

        <div key={'editableTags'} style={{ marginBottom: 20 }}>
            <EditableTags
                tags={tags}
                onSave={(newTags) => setTags(newTags)}
                isNewTagBtnVisible={true}
            />
        </div>,
        <Form.Item style={{ display: 'none' }} key={5} name="tags">
            <div></div>
        </Form.Item>,

        <Form.Item key={'oldId'} name="oldId">
            <Input min={1} max={3000} type="number" placeholder="Old ID" style={{ width: 100 }} />
        </Form.Item>
    ]

    return <Form form={form}>{articleFormItems}</Form>
}

export default ArticleForm
