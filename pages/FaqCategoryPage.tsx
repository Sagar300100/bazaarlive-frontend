
import React from 'react';
import { faqData, FaqCategory } from '../constants/faqData';

interface FaqCategoryPageProps {
    categoryKey: string | null;
    onNavigate: (page: string, data?: any) => void;
}

const FaqCategoryPage: React.FC<FaqCategoryPageProps> = ({ categoryKey, onNavigate }) => {
    if (!categoryKey || !(categoryKey in faqData)) {
        return (
            <div className="min-h-screen bg-gray-800 text-white flex items-center justify-center">
                <p>Category not found.</p>
            </div>
        );
    }

    const category: FaqCategory = faqData[categoryKey as keyof typeof faqData];
    
    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen">
             <header className="bg-gray-800 border-b border-gray-700">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <nav className="text-sm font-medium" aria-label="Breadcrumb">
                        <ol className="list-none p-0 inline-flex items-center">
                            <li className="flex items-center">
                                <button onClick={() => onNavigate('help-center')} className="text-gray-400 hover:text-white">Whatnot Help Center</button>
                            </li>
                            <li className="flex items-center">
                                <svg className="fill-current w-3 h-3 mx-3 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M7 1L5.6 2.5L13 10l-7.4 7.5L7 19l9-9z"/></svg>
                                <span className="text-white font-semibold">{category.title}</span>
                            </li>
                        </ol>
                    </nav>
                </div>
            </header>
             <div className="bg-gray-800">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                     <h1 className="text-4xl font-extrabold text-white">{category.title}</h1>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                 <div className="bg-gray-800 p-6 sm:p-8 rounded-lg">
                    {category.sections.map((section, index) => (
                        <section key={index} className="mb-10 last:mb-0">
                            <h2 className="text-2xl font-bold text-white mb-6">{section.title}</h2>
                            <div className="space-y-4">
                                {section.articles.map(article => (
                                    <button
                                        key={article.slug}
                                        onClick={() => onNavigate('help-article', { category: categoryKey, article: article.slug })}
                                        className="block text-left w-full text-lg text-gray-300 hover:text-orange-400 transition-colors"
                                    >
                                        {article.title}
                                    </button>
                                ))}
                            </div>
                        </section>
                    ))}
                 </div>
            </main>
        </div>
    );
};

export default FaqCategoryPage;
