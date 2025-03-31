interface LoadingProps {
    text?: string;
}

const Loading = ({ text = 'Carregando...' }: LoadingProps) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
            <div data-testid="loading-animation" className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">{text}</p>
        </div>
    );
};

export default Loading; 