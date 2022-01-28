import { Button, Form, Input } from 'antd'
import { errorNotification, warningNotification } from '../../utils/notifications'

export function TreeDataPopoverContent({
    form,
    action,
    onAction,
    initialValues
}: {
    form: any
    action: string
    onAction?: (body: any) => void
    initialValues?: any
}) {
    return (
        <div>
            <Form form={form} initialValues={initialValues || {}}>
                <Form.Item
                    style={{ margin: 0 }}
                    key={1}
                    name="title"
                    rules={[
                        {
                            required: true,
                            message: 'Please set the menu element title!'
                        }
                    ]}
                >
                    <Input size="small" placeholder="Title" />
                </Form.Item>
                <Form.Item style={{ margin: 0 }} key={2} name="hidden" label="Hidden">
                    <Input size="small" type="checkbox" />
                </Form.Item>
                <Form.Item style={{ margin: 0 }} key={3} name="link">
                    <Input size="small" placeholder="Link" />
                </Form.Item>
            </Form>
            <div style={{ textAlign: 'right', marginTop: 10 }}>
                <Button
                    size="small"
                    type="primary"
                    onClick={() => {
                        form.validateFields()
                            .then((values: any) => {
                                const body: any = {}
                                for (const key in values) {
                                    if (form.isFieldTouched(key)) {
                                        body[key] = values[key]
                                    }
                                }
                                if (Object.keys(body).length) {
                                    onAction && onAction(body)
                                } else warningNotification('You should do any changes to update menu element!')
                                form.resetFields()
                            })
                            .catch(errorNotification('Validation error!'))
                    }}
                >
                    {action}
                </Button>
            </div>
        </div>
    )
}
