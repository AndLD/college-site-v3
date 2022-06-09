import { DatePicker, Tooltip } from 'antd'
import moment from 'moment'
import { useContext } from 'react'
import { ActionsContext } from '../../contexts'

function DateRangePicker() {
    const [dateRangeValue, setDateRangeValue] = useContext(ActionsContext).dateRangeValueState

    return (
        <div style={{ flex: 1, marginLeft: 10, minWidth: 250 }}>
            <Tooltip title="Filter actions by date range">
                <DatePicker.RangePicker
                    value={
                        (dateRangeValue && [
                            moment(dateRangeValue[0]),
                            moment(dateRangeValue[1])
                        ]) ||
                        null
                    }
                    // TODO: Remove onFocus
                    // onFocus={() => {
                    //     if (!dateRangeValue) {
                    //         const timestamp = Date.now()
                    //         setDateRangeValue([timestamp, timestamp])
                    //     }
                    // }}
                    format="DD/MM/YYYY"
                    onChange={(rangeValue: any) => {
                        if (rangeValue) {
                            const startTimestamp = new Date(
                                (rangeValue[0] as moment.Moment).startOf('day').format()
                            ).valueOf()
                            const endTimestamp = new Date(
                                (rangeValue[1] as moment.Moment).endOf('day').format()
                            ).valueOf()

                            setDateRangeValue([startTimestamp, endTimestamp])
                        } else {
                            setDateRangeValue(null)
                        }
                    }}
                    disabledDate={(current) => {
                        const customDate = moment()[current > moment() ? 'startOf' : 'endOf']('day')
                        return current && current > moment(customDate).endOf('day')
                    }}
                />
            </Tooltip>
        </div>
    )
}

export default DateRangePicker
