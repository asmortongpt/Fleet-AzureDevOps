}

#Preview {
    NavigationView {
        CourseDetailView(
            course: TrainingCourse.sample,
            viewModel: TrainingManagementViewModel()
        )
    }
}
