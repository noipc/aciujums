'use client';

export default function LoadingSpinner() {
    return (
        <div className="loading-spinner-container">
            <div className="loading-spinner">
                <div className="loading-dots">
                    <div></div>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>
            </div>
        </div>
    )
}