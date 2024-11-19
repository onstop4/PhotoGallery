// One week converted into seconds.
const duration = 604800;

function shouldRefresh(startDate: Date | undefined) {
    return !startDate || (new Date().getTime() - startDate.getTime()) / 1000 >= duration;
}

export { duration, shouldRefresh };